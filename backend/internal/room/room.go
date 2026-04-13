package room

import (
	"fmt"
    "sort"
    "sync"
    "time"
)

type TrackInfo struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Artist   string `json:"artist"`
	Image    string `json:"image"`
	Duration int    `json:"duration"` // seconds
	Preview  string `json:"previewUrl"`
}

type Track struct {
	QueueID   string            `json:"queueId"`
	Info      TrackInfo         `json:"info"`
	Votes     map[string]bool   `json:"-"` // clientId -> liked
	VoteCount int               `json:"votes"`
	AddedBy   string            `json:"addedBy"` // clientId
	AddedAt   time.Time         `json:"addedAt"`
}

type PlaybackState struct {
	IsPlaying   bool    `json:"isPlaying"`
	CurrentTime float64 `json:"currentTime"`
	Volume      float64 `json:"volume"`
	TrackID     string  `json:"trackId"`
}

type Guest struct {
	ID        string    `json:"id"`
	JoinedAt  time.Time `json:"joinedAt"`
	Connected bool      `json:"connected"`
}

type Room struct {
	mu            sync.RWMutex
	ID            string
	HostToken     string
	Queue         []*Track
	CurrentTrack  *Track
	Playback      PlaybackState
	SkipVotes     map[string]bool // clientId -> vote
	Guests        map[string]*Guest
	LastActivity  time.Time
	nextQueueID   int
}

func NewRoom(id, hostToken string) *Room {
	r := &Room{
		ID:           id,
		HostToken:    hostToken,
		Queue:        make([]*Track, 0),
		Guests:       make(map[string]*Guest),
		SkipVotes:    make(map[string]bool),
		LastActivity: time.Now(),
		Playback:     PlaybackState{Volume: 0.8},
	}
	r.seedDefaultTracks()
	return r
}

// seedDefaultTracks добавляет начальные треки в очередь
func (r *Room) seedDefaultTracks() {
	defaults := []TrackInfo{
		{ID: "seed-1", Title: "Blinding Lights", Artist: "The Weeknd", Image: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/78/2e/44/782e44d3-4e0f-7ef5-f2d9-8a01d72c97b8/20UMGIM21885.rgb.jpg/100x100bb.jpg", Duration: 200},
		{ID: "seed-2", Title: "Shape of You", Artist: "Ed Sheeran", Image: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/b1/7c/5c/b17c5c82-4a8a-4f1d-d9fe-1f5a1d8a7c0d/190295851286.jpg/100x100bb.jpg", Duration: 234},
		{ID: "seed-3", Title: "Uptown Funk", Artist: "Mark Ronson ft. Bruno Mars", Image: "https://is1-ssl.mzstatic.com/image/thumb/Music4/v4/0f/1e/84/0f1e8427-2e05-22de-2c5a-d84b69b0a87a/886444714587.jpg/100x100bb.jpg", Duration: 270},
		{ID: "seed-4", Title: "Dance Monkey", Artist: "Tones and I", Image: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/dc/2e/7c/dc2e7c96-3c4c-1282-3a49-38ece4a29ebe/076DF-177.jpg/100x100bb.jpg", Duration: 210},
		{ID: "seed-5", Title: "Levitating", Artist: "Dua Lipa", Image: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/fb/7e/77/fb7e7748-d5bc-4c8b-9ab4-7a56f90fb447/20UM1IM07693.rgb.jpg/100x100bb.jpg", Duration: 203},
	}
	for i, info := range defaults {
		r.Queue = append(r.Queue, &Track{
			QueueID: fmt.Sprintf("seed-%d", i+1),
			Info:    info,
			Votes:   make(map[string]bool),
			AddedBy: "system",
			AddedAt: time.Now(),
		})
	}
}

// AddTrack добавляет трек в очередь и пересортировывает
func (r *Room) AddTrack(info TrackInfo, clientID string) *Track {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.nextQueueID++
	t := &Track{
		QueueID: fmt.Sprintf("q-%d", r.nextQueueID),
		Info:    info,
		Votes:   make(map[string]bool),
		AddedBy: clientID,
		AddedAt: time.Now(),
	}
	r.Queue = append(r.Queue, t)
	r.sortQueue()
	r.LastActivity = time.Now()
	return t
}

// Vote ставит или снимает лайк
func (r *Room) Vote(queueID, clientID string, value bool) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, t := range r.Queue {
		if t.QueueID == queueID {
			if value {
				t.Votes[clientID] = true
			} else {
				delete(t.Votes, clientID)
			}
			t.VoteCount = len(t.Votes)
			r.sortQueue()
			r.LastActivity = time.Now()
			return true
		}
	}
	return false
}

// RemoveTrack удаляет трек из очереди (только хост)
func (r *Room) RemoveTrack(queueID string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i, t := range r.Queue {
		if t.QueueID == queueID {
			r.Queue = append(r.Queue[:i], r.Queue[i+1:]...)
			r.LastActivity = time.Now()
			return true
		}
	}
	return false
}

// VoteSkip регистрирует голос за скип, возвращает (текущих голосов, нужно для скипа)
func (r *Room) VoteSkip(clientID string, agree bool) (int, int) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if agree {
		r.SkipVotes[clientID] = true
	} else {
		delete(r.SkipVotes, clientID)
	}
	active := r.activeGuestCount()
	threshold := active/2 + 1
	if threshold < 1 {
		threshold = 1
	}
	return len(r.SkipVotes), threshold
}

// NextTrack переходит к следующему треку
func (r *Room) NextTrack() *Track {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.SkipVotes = make(map[string]bool)
	if len(r.Queue) == 0 {
		r.CurrentTrack = nil
		r.Playback.IsPlaying = false
		r.Playback.TrackID = ""
		return nil
	}
	next := r.Queue[0]
	r.Queue = r.Queue[1:]
	r.CurrentTrack = next
	r.Playback.TrackID = next.QueueID
	r.Playback.CurrentTime = 0
	r.Playback.IsPlaying = true
	r.LastActivity = time.Now()
	return next
}

// AddGuest регистрирует гостя
func (r *Room) AddGuest(clientID string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if g, ok := r.Guests[clientID]; ok {
		g.Connected = true
	} else {
		r.Guests[clientID] = &Guest{ID: clientID, JoinedAt: time.Now(), Connected: true}
	}
	r.LastActivity = time.Now()
}

// RemoveGuest помечает гостя отключённым
func (r *Room) RemoveGuest(clientID string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if g, ok := r.Guests[clientID]; ok {
		g.Connected = false
	}
}

// ActiveGuestCount возвращает количество подключённых гостей
func (r *Room) ActiveGuestCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.activeGuestCount()
}

func (r *Room) activeGuestCount() int {
	count := 0
	for _, g := range r.Guests {
		if g.Connected {
			count++
		}
	}
	return count
}

// QueueSnapshot возвращает копию очереди для JSON
func (r *Room) QueueSnapshot() []*Track {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]*Track, len(r.Queue))
	copy(out, r.Queue)
	return out
}

// sortQueue — по убыванию голосов, при равенстве — по времени добавления (FIFO)
func (r *Room) sortQueue() {
	sort.Slice(r.Queue, func(i, j int) bool {
		if r.Queue[i].VoteCount != r.Queue[j].VoteCount {
			return r.Queue[i].VoteCount > r.Queue[j].VoteCount
		}
		return r.Queue[i].AddedAt.Before(r.Queue[j].AddedAt)
	})
}