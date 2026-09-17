import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type ChatMessage, type ChatThreadSummary } from "../lib/api";
import { useAuth } from "../lib/auth";

type SendState = "idle" | "sending";
type ThreadLoadState = "idle" | "loading" | "error";

export function Chat() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadLoadState, setThreadLoadState] = useState<ThreadLoadState>("idle");
  const [prompt, setPrompt] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [error, setError] = useState<string | null>(null);

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
      <aside id="chat-sidebar">
        <button type="button" className="new-chat-button" onClick={() => navigate("/")}>
          + New chat
        </button>
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
        <div className="sidebar-footer">
          <span className="user-email">{user?.email}</span>
          <button type="button" className="link-button" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </aside>

      <section id="chat-main">
        {messages.length === 0 && threadLoadState !== "loading" && (
          <div className="hero">
            <h1>Melodia</h1>
            <p className="tagline">AI-powered music discovery.</p>
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
              </div>
            ))}
            {sendState === "sending" && <p className="feedback">Thinking...</p>}
          </div>
        )}

        {error && <p className="feedback feedback--error">{error}</p>}

        <form onSubmit={handleSubmit} id="prompt-form" className="card">
          <textarea
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
