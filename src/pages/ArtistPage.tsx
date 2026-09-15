import { useParams } from "react-router-dom";

export function ArtistPage() {
  const { artistId } = useParams<{ artistId: string }>();

  return (
    <section id="artist">
      <h1>Artist</h1>
      <p>Artist id: {artistId}</p>
    </section>
  );
}
