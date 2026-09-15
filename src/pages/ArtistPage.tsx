import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, type ArtistDetail } from "../lib/api";

type LoadState = "loading" | "done" | "error";
type AlbumsLoadState = "idle" | "loading" | "error";

export function ArtistPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [albumsState, setAlbumsState] = useState<AlbumsLoadState>("idle");

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
      .ingestArtist(artist.name)
      .then((updated) => {
        setArtist(updated);
        setAlbumsState("idle");
      })
      .catch(() => setAlbumsState("error"));
  }

  if (state === "loading") return <p>Loading artist...</p>;
  if (state === "error" || !artist) return <p>Artist not found.</p>;

  return (
    <section id="artist">
      <h1>{artist.name}</h1>
      {artist.genres.length > 0 && (
        <p className="genres">{artist.genres.map((g) => g.name).join(", ")}</p>
      )}

      {artist.albums.length === 0 && (
        <div className="load-albums">
          <p>
            This artist was just discovered and hasn't had its discography pulled in
            yet.
          </p>
          <button type="button" onClick={loadAlbums} disabled={albumsState === "loading"}>
            {albumsState === "loading" ? "Loading albums..." : "Load albums"}
          </button>
          {albumsState === "error" && <p>Couldn't load albums. Try again?</p>}
        </div>
      )}

      {artist.albums.map((album) => (
        <div key={album.id} className="album">
          <h2>
            {album.title}
            {album.first_release_date && ` (${album.first_release_date.slice(0, 4)})`}
          </h2>
          <ol>
            {album.tracks.map((track) => (
              <li key={track.id}>{track.title}</li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}
