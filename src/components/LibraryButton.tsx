import { useState } from "react";

interface Props {
  inLibrary: boolean;
  onAdd: () => Promise<void>;
  onRemove: () => Promise<void>;
}

export function LibraryButton({ inLibrary, onAdd, onRemove }: Props) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function toggle() {
    setPending(true);
    setFailed(false);
    try {
      await (inLibrary ? onRemove() : onAdd());
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className={`library-button${inLibrary ? " library-button--added" : ""}`}
      onClick={toggle}
      disabled={pending}
      aria-pressed={inLibrary}
      title={failed ? "Something went wrong - try again" : undefined}
    >
      {failed ? "Try again" : inLibrary ? "✓ In library" : "+ Add to library"}
    </button>
  );
}
