import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, type ArtistDetail } from "../lib/api";

type LoadState = "loading" | "done" | "error";

export function ArtistPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [state, setState] = useState<LoadState>("loading");

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

  if (state === "loading") return <p>Loading artist...</p>;
  if (state === "error" || !artist) return <p>Artist not found.</p>;

  return (
    <section id="artist">
      <h1>{artist.name}</h1>
      {artist.genres.length > 0 && (
        <p className="genres">{artist.genres.map((g) => g.name).join(", ")}</p>
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
