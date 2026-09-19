import { type FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LibraryButton } from "../components/LibraryButton";
import { useLibrary } from "../lib/useLibrary";
import { api, type ChatMessage, type ChatThreadSummary } from "../lib/api";

const PIN_KEY = "melodia.sidebarPinned";

const DEFAULT_PROMPTS = [
  "Recommend some artists I might like",
  "Help me discover new music",
  "Find artists similar to my library",
  "Surprise me with something different",
];

function readPinned() {
  try {
    return localStorage.getItem(PIN_KEY) === "true";
  } catch {
    return false;
  }
}

type SendState = "idle" | "sending";
type ThreadLoadState = "idle" | "loading" | "error";

export function Chat() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  
  const library = useLibrary();
  const [pinned, setPinned] = useState(readPinned);
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadLoadState, setThreadLoadState] = useState<ThreadLoadState>("idle");
  const [prompt, setPrompt] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [error, setError] = useState<string | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  function togglePinned() {
    const next = !pinned;
    setPinned(next);
    try {
      localStorage.setItem(PIN_KEY, String(next));
    } catch {
      // ignore storage failures; pin state just won't persist
    }
  }

  function refreshThreads() {
    api.listThreads().then(setThreads).catch(() => undefined);
  }

  useEffect(() => {
    refreshThreads();
  }, []);

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      return;
    }
    setThreadLoadState("loading");
    api
      .getThread(threadId)
      .then((thread) => {
        setMessages(thread.messages);
        setThreadLoadState("idle");
      })
      .catch(() => setThreadLoadState("error"));
  }, [threadId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (trimmed.length === 0 || sendState === "sending") return;

    setError(null);
    setSendState("sending");
    setPrompt("");

    const optimisticUserMessage: ChatMessage = {
      id: `pending-${Date.now()}`,
      role: "user",
      content: trimmed,
      recommended_artists: null,
      sources: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      if (!threadId) {
        const thread = await api.createThread(trimmed);
        setMessages(thread.messages);
        navigate(`/chat/${thread.id}`);
      } else {
        const assistantMessage = await api.postMessage(threadId, trimmed);
        setMessages((prev) => [...prev, assistantMessage]);
      }
      refreshThreads();
    } catch {
      setError("Couldn't get a reply. Is the backend running?");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMessage.id));
      setPrompt(trimmed);
    } finally {
      setSendState("idle");
    }
  }

  async function handleDelete(id: string) {
    await api.deleteThread(id).catch(() => undefined);
    refreshThreads();
    if (id === threadId) navigate("/");
  }

  return (
    <div id="chat-layout">
      <div className={`sidebar-slot${pinned ? " sidebar-slot--pinned" : ""}`}>
      <aside id="chat-sidebar" className={pinned ? "pinned" : undefined}>
        <div className="sidebar-header">
          <button type="button" className="new-chat-button" onClick={() => navigate("/")}>
            + New chat
          </button>
          <button
            type="button"
            className={`pin-button${pinned ? " pin-button--active" : ""}`}
            aria-pressed={pinned}
            aria-label={pinned ? "Unpin sidebar" : "Pin sidebar open"}
            title={pinned ? "Unpin sidebar" : "Pin sidebar open"}
            onClick={togglePinned}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M16 3l5 5-2 1-3 3v4l-2 2-3-3-6 6-1-1 6-6-3-3 2-2h4l3-3 1-2z" />
            </svg>
          </button>
        </div>
        <nav className="thread-list">
          {threads.map((thread) => (
            <div key={thread.id} className={`thread-item${thread.id === threadId ? " thread-item--active" : ""}`}>
              <Link to={`/chat/${thread.id}`}>{thread.title ?? "New chat"}</Link>
              <button
                type="button"
                className="thread-delete"
                aria-label="Delete thread"
                onClick={() => handleDelete(thread.id)}
              >
                ×
              </button>
            </div>
          ))}
        </nav>
      </aside>
      </div>

      <section id="chat-main">
        {messages.length === 0 && threadLoadState !== "loading" && (
          <div className="hero">
            <h1>Melodia</h1>
            <p className="tagline">AI-powered music discovery.</p>
            <div className="prompt-pills">
              {DEFAULT_PROMPTS.map((text) => (
                <button
                  key={text}
                  type="button"
                  className="prompt-pill"
                  onClick={() => {
                    setPrompt(text);
                    promptRef.current?.focus();
                  }}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {threadLoadState === "loading" && messages.length === 0 && (
          <p className="feedback">Loading conversation...</p>
        )}
        {threadLoadState === "error" && (
          <p className="feedback feedback--error">Couldn't load that conversation.</p>
        )}

        {messages.length > 0 && (
          <div className="message-list">
            {messages.map((message) => (
              <div key={message.id} className={`message message--${message.role}`}>
                <p className="message-content">{message.content}</p>
                {message.recommended_artists && message.recommended_artists.length > 0 && (
                  <ul className="recommend-results">
                    {message.recommended_artists.map((artist) => (
                      <li key={artist.id} className="recommendation card">
                        <div className="recommendation-header">
                          <Link to={`/artists/${artist.id}`} className="recommendation-name">
                            {artist.name}
                          </Link>
                          <LibraryButton
                            inLibrary={library.ids.has(artist.id)}
                            onAdd={() => library.add(artist.id)}
                            onRemove={() => library.remove(artist.id)}
                          />
                        </div>
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
                {message.sources && message.sources.length > 0 && (
                  <div className="message-sources">
                    <span className="message-sources-label">From your library</span>
                    <ul className="source-chips">
                      {message.sources.map((source) => (
                        <li key={source.id}>
                          <Link to={`/artists/${source.id}`} className="source-chip">
                            {source.name}
                            <span className="source-chip-match">
                              {Math.round(source.similarity * 100)}%
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {sendState === "sending" && <p className="feedback">Thinking...</p>}
          </div>
        )}

        {error && <p className="feedback feedback--error">{error}</p>}

        <form onSubmit={handleSubmit} id="prompt-form" className="card">
          <textarea
            ref={promptRef}
            placeholder="Ask for recommendations, or follow up on what you already got..."
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            aria-label="Message"
            rows={3}
          />
          <button type="submit" disabled={sendState === "sending"}>
            {sendState === "sending" ? "Thinking..." : "Send"}
          </button>
        </form>
      </section>
    </div>
  );
}
