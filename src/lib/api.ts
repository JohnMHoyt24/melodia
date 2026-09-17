import { supabase } from "./supabase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function authedRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");

  return request<T>(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommended_artists: RecommendedArtist[] | null;
  created_at: string;
}

export interface ChatThreadSummary {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatThreadDetail extends ChatThreadSummary {
  messages: ChatMessage[];
}

export const api = {
  health: () => request<HealthStatus>("/health"),
  listArtists: () => request<Artist[]>("/artists"),
  search: (q: string) =>
    request<ArtistSearchResult[]>(`/search?q=${encodeURIComponent(q)}`),
  getArtist: (id: string) => request<ArtistDetail>(`/artists/${id}`),
  loadAlbums: (artistId: string, limit = 10) =>
    request<ArtistDetail>(`/artists/${artistId}/albums?limit=${limit}`, {
      method: "POST",
    }),
  loadTracks: (albumId: string) =>
    request<Album>(`/albums/${albumId}/tracks`, { method: "POST" }),
  listThreads: () => authedRequest<ChatThreadSummary[]>("/chat/threads"),
  createThread: (message: string) =>
    authedRequest<ChatThreadDetail>("/chat/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }),
  getThread: (threadId: string) =>
    authedRequest<ChatThreadDetail>(`/chat/threads/${threadId}`),
  postMessage: (threadId: string, message: string) =>
    authedRequest<ChatMessage>(`/chat/threads/${threadId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }),
  deleteThread: (threadId: string) =>
    authedRequest<void>(`/chat/threads/${threadId}`, { method: "DELETE" }),
};
