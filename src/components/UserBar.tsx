import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function UserBar() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  if (!user) return null;

  const name = profile.displayName || user.email || "Account";
  const initial = name.charAt(0).toUpperCase();

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && open) {
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    if (!open) {
      setOpen(true);
      return;
    }
    const items = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
    items[(next + items.length) % items.length]?.focus();
  }

  return (
    <div className="user-bar" ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        ref={triggerRef}
        className="user-bar-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {profile.avatarUrl ? (
          <img className="avatar" src={profile.avatarUrl} alt="" />
        ) : (
          <span className="avatar avatar--initial">{initial}</span>
        )}
        <span className="user-bar-name">{name}</span>
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" className="user-bar-caret">
          <path
            d="M2 4l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="user-menu" role="menu">
          <Link to="/profile" role="menuitem" onClick={() => setOpen(false)}>
            Edit profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
