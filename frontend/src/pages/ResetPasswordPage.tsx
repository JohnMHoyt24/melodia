import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function ResetPasswordPage() {
  const { user, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await updatePassword(password);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDone(true);
    setTimeout(() => navigate("/", { replace: true }), 1500);
  }

  if (loading) return null;

  // Opening the emailed link signs the user in with a short-lived recovery session;
  // without one, the link was invalid, expired, or already used.
  if (!user) {
    return (
      <section id="auth">
        <div className="hero">
          <h1>Melodia</h1>
          <p className="tagline">This reset link is invalid or has expired.</p>
        </div>
        <p className="feedback">
          <Link to="/login">Back to sign in</Link> and request a new link.
        </p>
      </section>
    );
  }

  return (
    <section id="auth">
      <div className="hero">
        <h1>Melodia</h1>
        <p className="tagline">Choose a new password.</p>
      </div>

      <form onSubmit={handleSubmit} id="auth-form" className="card">
        <label>
          New password
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label>
          Confirm new password
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </label>
        <button type="submit" disabled={saving || done}>
          {saving ? "Saving..." : "Update password"}
        </button>
      </form>

      {error && <p className="feedback feedback--error">{error}</p>}
      {done && <p className="feedback">Password updated. Taking you to your chats...</p>}
    </section>
  );
}
