import type { Session, User } from "@supabase/supabase-js";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AVATAR_BUCKET = "avatars";

export const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
};
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export interface Profile {
  displayName: string;
  bio: string;
  favoriteGenres: string;
  avatarUrl: string;
}

export function getProfile(user: User | null): Profile {
  const meta = user?.user_metadata ?? {};
  return {
    displayName: meta.display_name ?? "",
    bio: meta.bio ?? "",
    favoriteGenres: meta.favorite_genres ?? "",
    avatarUrl: meta.avatar_url ?? "",
  };
}

interface AuthContextValue {
  user: User | null;
  profile: Profile;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  updateProfile: (profile: Profile) => Promise<{ error: string | null }>;
  uploadAvatar: (file: File) => Promise<{ url: string | null; error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }

  async function requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function updateProfile(profile: Profile) {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: profile.displayName.trim(),
        bio: profile.bio.trim(),
        favorite_genres: profile.favoriteGenres.trim(),
        avatar_url: profile.avatarUrl.trim(),
      },
    });
    if (!error && data.user) {
      setSession((prev) => (prev ? { ...prev, user: data.user } : prev));
    }
    return { error: error?.message ?? null };
  }

  async function uploadAvatar(file: File) {
    const userId = session?.user.id;
    if (!userId) return { url: null, error: "Not signed in" };

    const extension = AVATAR_EXTENSIONS[file.type];
    if (!extension) return { url: null, error: "Avatar must be a .png, .jpg, or .gif file." };

    // Unique name per upload so browsers/CDN never serve a stale cached avatar.
    const path = `${userId}/avatar-${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { contentType: file.type });
    if (error) return { url: null, error: error.message };

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  }

  const user = session?.user ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: getProfile(user),
        session,
        loading,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        updatePassword,
        updateProfile,
        uploadAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
