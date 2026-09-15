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

export const api = {
  health: () => request<HealthStatus>("/health"),
  listArtists: () => request<Artist[]>("/artists"),
};
