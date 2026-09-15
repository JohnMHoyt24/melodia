import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type RecommendedArtist } from "../lib/api";

type ApiState = "checking" | "online" | "offline";
type RecommendState = "idle" | "loading" | "done" | "error";

export function Home() {
  const [apiState, setApiState] = useState<ApiState>("checking");
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<RecommendedArtist[]>([]);
  const [recommendState, setRecommendState] = useState<RecommendState>("idle");

  useEffect(() => {
    api
      .health()
      .then(() => setApiState("online"))
      .catch(() => setApiState("offline"));
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (trimmed.length === 0) return;

    setRecommendState("loading");
    api
      .recommend(trimmed)
      .then((found) => {
        setResults(found);
        setRecommendState("done");
      })
      .catch(() => setRecommendState("error"));
  }

  return (
    <section id="home">
      <div className="hero">
        <h1>Melodia</h1>
        <p className="tagline">AI-powered music discovery.</p>
        <p className="status-line">
          {/*Backend status:{" "}
          <span className={`status-badge status-badge--${apiState}`}>
            <span className="status-dot" aria-hidden="true" />
            {apiState}
          </span>*/}
        </p>
      </div>

      <form onSubmit={handleSubmit} id="prompt-form" className="card">
        <textarea
          placeholder="Enter your favorite artists, genres, or a description of what you want to hear..."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          aria-label="Describe what you're looking for"
          rows={3}
        />
        <button type="submit" disabled={recommendState === "loading"}>
          {recommendState === "loading" ? "Thinking..." : "Suggest artists"}
        </button>
      </form>

      {recommendState === "loading" && (
        <p className="feedback">Asking around... this can take a little while.</p>
      )}
      {recommendState === "error" && (
        <p className="feedback feedback--error">
          Couldn't get recommendations. Is the backend running?
        </p>
      )}
      {recommendState === "done" && results.length === 0 && (
        <p className="feedback">
          No verifiable artists came back for that one - try rephrasing.
        </p>
      )}

      {results.length > 0 && (
        <ul id="recommend-results">
          {results.map((artist) => (
            <li key={artist.id} className="recommendation card">
              <Link to={`/artists/${artist.id}`} className="recommendation-name">
                {artist.name}
              </Link>
              {artist.genres.length > 0 && (
                <div className="genre-tags">
                  {artist.genres.map((genre) => (
                    <span key={genre} className="genre-tag">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              <p className="reason">{artist.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
