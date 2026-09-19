import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type LibraryArtist } from "../lib/api";

type LoadState = "loading" | "done" | "error";

export function LibraryPage() {
  const [artists, setArtists] = useState<LibraryArtist[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    api
      .listLibrary()
      .then((list) => {
        setArtists(list);
        setState("done");
      })
      .catch(() => setState("error"));
  }, []);

  async function remove(artistId: string) {
    await api.removeFromLibrary(artistId).catch(() => undefined);
    setArtists((prev) => prev.filter((artist) => artist.id !== artistId));
  }

  return (
    <section id="library">
      <Link to="/" className="back-link">
        ← Back to Melodia
      </Link>
      <div className="hero">
        <h1>My library</h1>
        <p className="tagline">Artists you've saved. They shape your recommendations.</p>
      </div>

      {state === "loading" && <p className="feedback">Loading your library...</p>}
      {state === "error" && (
        <p className="feedback feedback--error">Couldn't load your library.</p>
      )}
      {state === "done" && artists.length === 0 && (
        <p className="feedback">
          Nothing here yet. <Link to="/">Ask for recommendations</Link> and add the ones you
          like.
        </p>
      )}

      <ul className="library-list">
        {artists.map((artist) => (
          <li key={artist.id} className="library-item card">
            <div className="recommendation-header">
              <Link to={`/artists/${artist.id}`} className="recommendation-name">
                {artist.name}
              </Link>
              <button
                type="button"
                className="library-button library-button--added"
                onClick={() => remove(artist.id)}
              >
                Remove
              </button>
            </div>
            {artist.genres.length > 0 && (
              <div className="genre-tags">
                {artist.genres.slice(0, 6).map((genre) => (
                  <span key={genre} className="genre-tag">
                    {genre}
                  </span>
                ))}
              </div>
            )}
            <p className="library-added">
              Added {new Date(artist.added_at).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
