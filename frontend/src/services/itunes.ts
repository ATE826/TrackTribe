// ── iTunes Search API (no auth required) ──────────────────────────────────
export interface ItunesTrack {
  trackId: number
  trackName: string
  artistName: string
  artworkUrl100: string
  trackTimeMillis: number
  previewUrl?: string
  collectionName?: string
}

export async function searchTracks(query: string): Promise<ItunesTrack[]> {
  if (!query.trim()) return []
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=8&country=ru`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return (data.results as ItunesTrack[]) ?? []
  } catch {
    return []
  }
}
