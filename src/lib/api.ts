const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export interface HealthStatus {
  status: string;
}

export interface Artist {
  id: string;
  name: string;
  musicbrainz_id: string | null;
  created_at: string;
}

export interface ArtistSearchResult {
  id: string;
  name: string;
  genres: string[];
}

export interface Track {
  id: string;
  title: string;
  track_number: number | null;
  length_ms: number | null;
}

export interface Album {
  id: string;
  title: string;
  primary_type: string | null;
  first_release_date: string | null;
  tracks: Track[];
}

export interface ArtistDetail extends Artist {
  genres: { name: string }[];
  albums: Album[];
}

export interface RecommendedArtist {
  id: string;
  name: string;
  genres: string[];
  reason: string;
}

export const api = {
  health: () => request<HealthStatus>("/health"),
  listArtists: () => request<Artist[]>("/artists"),
  search: (q: string) =>
    request<ArtistSearchResult[]>(`/search?q=${encodeURIComponent(q)}`),
  getArtist: (id: string) => request<ArtistDetail>(`/artists/${id}`),
  ingestArtist: (name: string, albumLimit = 10) =>
    request<ArtistDetail>("/artists/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, album_limit: albumLimit }),
    }),
  recommend: (prompt: string, count = 5) =>
    request<RecommendedArtist[]>("/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, count }),
    }),
};
