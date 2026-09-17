import { type FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

type Mode = "sign-in" | "sign-up";
type SubmitState = "idle" | "loading" | "error";

export function AuthPage() {
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [signedUp, setSignedUp] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitState("loading");
    setError(null);

    const { error: authError } = mode === "sign-in" ? await signIn(email, password) : await signUp(email, password);

    if (authError) {
      setError(authError);
      setSubmitState("error");
      return;
    }

    setSubmitState("idle");
    if (mode === "sign-up") setSignedUp(true);
  }

  return (
    <section id="auth">
      <div className="hero">
        <h1>Melodia</h1>
        <p className="tagline">
          {mode === "sign-in" ? "Sign in to continue your conversations." : "Create an account to save your chats."}
        </p>
      </div>

      <form onSubmit={handleSubmit} id="auth-form" className="card">
        <label>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit" disabled={submitState === "loading"}>
          {submitState === "loading" ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Sign up"}
        </button>
      </form>

      {error && <p className="feedback feedback--error">{error}</p>}
      {signedUp && (
        <p className="feedback">Account created - check your email to confirm, then sign in.</p>
      )}

      <p className="feedback">
        {mode === "sign-in" ? "New here? " : "Already have an account? "}
        <button
          type="button"
          className="link-button"
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setError(null);
            setSignedUp(false);
          }}
        >
          {mode === "sign-in" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </section>
  );
}
