import { type FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

type Mode = "sign-in" | "sign-up" | "reset";
type SubmitState = "idle" | "loading" | "error";

export function AuthPage() {
  const { user, signIn, signUp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [signedUp, setSignedUp] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitState("loading");
    setError(null);

    const { error: authError } =
      mode === "reset"
        ? await requestPasswordReset(email)
        : mode === "sign-in"
          ? await signIn(email, password)
          : await signUp(email, password);

    if (authError) {
      setError(authError);
      setSubmitState("error");
      return;
    }

    setSubmitState("idle");
    if (mode === "sign-up") setSignedUp(true);
    if (mode === "reset") setResetSent(true);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSignedUp(false);
    setResetSent(false);
    setSubmitState("idle");
  }

  return (
    <section id="auth">
      <div className="hero">
        <h1>Melodia</h1>
        <p className="tagline">
          {mode === "sign-in" && "Sign in to continue your conversations."}
          {mode === "sign-up" && "Create an account to save your chats."}
          {mode === "reset" && "Enter your email and we'll send you a link to reset your password."}
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
        {mode !== "reset" && (
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
        )}
        <button type="submit" disabled={submitState === "loading"}>
          {submitState === "loading"
            ? "Please wait..."
            : mode === "sign-in"
              ? "Sign in"
              : mode === "sign-up"
                ? "Sign up"
                : "Send reset link"}
        </button>
      </form>

      {error && <p className="feedback feedback--error">{error}</p>}
      {signedUp && (
        <p className="feedback">Account created - check your email to confirm, then sign in.</p>
      )}

      {resetSent && (
        <p className="feedback">
          If an account exists for that email, a reset link is on its way. Check your inbox.
        </p>
      )}

      {mode === "sign-in" && (
        <p className="feedback">
          <button type="button" className="link-button" onClick={() => switchMode("reset")}>
            Forgot your password?
          </button>
        </p>
      )}

      <p className="feedback">
        {mode === "sign-up" ? "Already have an account? " : mode === "reset" ? "Remembered it? " : "New here? "}
        <button
          type="button"
          className="link-button"
          onClick={() => switchMode(mode === "sign-in" ? "sign-up" : "sign-in")}
        >
          {mode === "sign-in" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </section>
  );
}
