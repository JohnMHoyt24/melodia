import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type ArtistDetail } from "../lib/api";

type LoadState = "loading" | "done" | "error";
type AlbumsLoadState = "idle" | "loading" | "error";

export function ArtistPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [albumsState, setAlbumsState] = useState<AlbumsLoadState>("idle");
  const [tracksLoadedFor, setTracksLoadedFor] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!artistId) return;
    setState("loading");
    api
      .getArtist(artistId)
      .then((found) => {
        setArtist(found);
        setState("done");
      })
      .catch(() => setState("error"));
  }, [artistId]);

  function loadAlbums() {
    if (!artist) return;
    setAlbumsState("loading");
    api
      .loadAlbums(artist.id)
      .then((updated) => {
        setArtist(updated);
        setAlbumsState("idle");

        // Album titles are already in `updated` and shown immediately. Each
        // album's tracklist is a separate, slower MusicBrainz call - fetch them
        // in the background so the page doesn't block on all of them upfront.
        updated.albums.forEach((album) => {
          api
            .loadTracks(album.id)
            .then((withTracks) => {
              setArtist((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  albums: prev.albums.map((a) => (a.id === withTracks.id ? withTracks : a)),
                };
              });
            })
            .finally(() => {
              setTracksLoadedFor((prev) => new Set(prev).add(album.id));
            });
        });
      })
      .catch(() => setAlbumsState("error"));
  }

  if (state === "loading") {
    return (
      <section id="artist">
        <Link to="/" className="back-link">
          ← Back to Melodia
        </Link>
        <p className="feedback">Loading artist...</p>
      </section>
    );
  }
  if (state === "error" || !artist) {
    return (
      <section id="artist">
        <Link to="/" className="back-link">
          ← Back to Melodia
        </Link>
        <p className="feedback feedback--error">Artist not found.</p>
      </section>
    );
  }

  return (
    <section id="artist">
      <Link to="/" className="back-link">
        ← Back to Melodia
      </Link>
      <div className="hero">
        <h1>{artist.name}</h1>
        {artist.genres.length > 0 && (
          <div className="genre-tags">
            {artist.genres.map((genre) => (
              <span key={genre.name} className="genre-tag">
                {genre.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {artist.albums.length === 0 && (
        <div className="load-albums card">
          <p>
            This artist was just discovered and hasn't had its discography pulled in
            yet.
          </p>
          <button type="button" onClick={loadAlbums} disabled={albumsState === "loading"}>
            {albumsState === "loading" ? "Loading albums..." : "Load albums"}
          </button>
          {albumsState === "error" && (
            <p className="feedback feedback--error">Couldn't load albums. Try again?</p>
          )}
        </div>
      )}

      {artist.albums.length > 0 && (
        <div className="albums">
          {artist.albums.map((album) => (
            <div key={album.id} className="album card">
              <h2>
                {album.title}
                {album.first_release_date && (
                  <span className="album-year">
                    {" "}
                    {album.first_release_date.slice(0, 4)}
                  </span>
                )}
              </h2>
              {album.tracks.length > 0 ? (
                <ol className="tracklist">
                  {album.tracks.map((track) => (
                    <li key={track.id}>{track.title}</li>
                  ))}
                </ol>
              ) : tracksLoadedFor.has(album.id) ? (
                <p className="feedback">No tracklist found for this album.</p>
              ) : (
                <p className="feedback">Loading tracklist...</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
