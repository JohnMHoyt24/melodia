import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type ArtistSearchResult } from "../lib/api";

type ApiState = "checking" | "online" | "offline";
type SearchState = "idle" | "loading" | "done" | "error";

export function Home() {
  const [apiState, setApiState] = useState<ApiState>("checking");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArtistSearchResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");

  useEffect(() => {
    api
      .health()
      .then(() => setApiState("online"))
      .catch(() => setApiState("offline"));
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setResults([]);
      setSearchState("idle");
      return;
    }

    setSearchState("loading");
    const timeout = setTimeout(() => {
      api
        .search(trimmed)
        .then((found) => {
          setResults(found);
          setSearchState("done");
        })
        .catch(() => setSearchState("error"));
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <section id="home">
      <h1>Melodia</h1>
      <p>AI-powered music discovery.</p>
      <p>
        Backend status:{" "}
        <strong className={`api-status api-status--${apiState}`}>
          {apiState}
        </strong>
      </p>

      <input
        type="search"
        placeholder="Search ingested artists..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search artists"
      />

      {searchState === "loading" && <p>Searching...</p>}
      {searchState === "error" && <p>Search failed. Is the backend running?</p>}
      {searchState === "done" && results.length === 0 && (
        <p>No artists found for "{query}".</p>
      )}

      {results.length > 0 && (
        <ul id="search-results">
          {results.map((artist) => (
            <li key={artist.id}>
              <Link to={`/artists/${artist.id}`}>{artist.name}</Link>
              {artist.genres.length > 0 && (
                <span className="genres"> — {artist.genres.join(", ")}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
