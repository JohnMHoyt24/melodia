import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { useAuth } from "./auth";

/**
 * The signed-in user's library membership, shared by anything that shows an
 * "add to library" control. `version` bumps on every change so views derived from the
 * library (e.g. the similar-artists strip) can refetch.
 */
export function useLibrary() {
  const { user } = useAuth();
  const userId = user?.id;
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    api
      .listLibrary()
      .then((list) => {
        if (!cancelled) setIds(new Set(list.map((artist) => artist.id)));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const add = useCallback(async (artistId: string) => {
    await api.addToLibrary(artistId);
    setIds((prev) => new Set(prev).add(artistId));
    setVersion((v) => v + 1);
  }, []);

  const remove = useCallback(async (artistId: string) => {
    await api.removeFromLibrary(artistId);
    setIds((prev) => {
      const next = new Set(prev);
      next.delete(artistId);
      return next;
    });
    setVersion((v) => v + 1);
  }, []);

  return { signedIn: userId !== undefined, ids, version, add, remove };
}
