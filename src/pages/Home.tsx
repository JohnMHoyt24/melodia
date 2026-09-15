import { useEffect, useState } from "react";
import { api } from "../lib/api";

type ApiState = "checking" | "online" | "offline";

export function Home() {
  const [apiState, setApiState] = useState<ApiState>("checking");

  useEffect(() => {
    api
      .health()
      .then(() => setApiState("online"))
      .catch(() => setApiState("offline"));
  }, []);

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
    </section>
  );
}
