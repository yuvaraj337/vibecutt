/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VIBE CUT — Admin Authentication Service
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Integrates directly with Supabase Auth. Does NOT contain
   hardcoded credentials. When Supabase is unconfigured,
   provides an isolated development session fallback.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { AuthUser, AuthSession } from "./types";

const DEV_AUTH_SESSION_KEY = "vibecut_dev_auth_session_v1";

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  // ── Supabase Production Auth ──
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const session: AuthSession = {
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            role: (data.user.user_metadata?.role as string) || "admin",
          }
        : null,
      accessToken: data.session?.access_token,
      expiresAt: data.session?.expires_at,
    };

    return { success: true, session };
  }

  // ── Development Fallback Mode (Isolated) ──
  // Note: For local development before Supabase keys are connected,
  // we validate that non-empty email/password were submitted.
  if (!email || !password || password.length < 6) {
    return {
      success: false,
      error: "Please enter a valid email and password (min 6 characters).",
    };
  }

  const devSession: AuthSession = {
    user: {
      id: "dev_admin_user",
      email: email.trim(),
      role: "admin",
    },
    accessToken: `dev_token_${Date.now()}`,
    expiresAt: Math.floor(Date.now() / 1000) + 86400, // 24 hours
  };

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(DEV_AUTH_SESSION_KEY, JSON.stringify(devSession));
    } catch {
      // Storage unavailable
    }
  }

  return { success: true, session: devSession };
}

export async function signOut(): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(DEV_AUTH_SESSION_KEY);
    } catch {
      // Storage unavailable
    }
  }

  return { success: true };
}

export async function getSession(): Promise<AuthSession | null> {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;

    return {
      user: data.session.user
        ? {
            id: data.session.user.id,
            email: data.session.user.email,
            role: (data.session.user.user_metadata?.role as string) || "admin",
          }
        : null,
      accessToken: data.session.access_token,
      expiresAt: data.session.expires_at,
    };
  }

  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(DEV_AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();
  return session?.user || null;
}

export function onAuthStateChange(
  callback: (session: AuthSession | null) => void
): () => void {
  if (isSupabaseConfigured() && supabase) {
    const { data } = supabase.auth.onAuthStateChange((_event, supabaseSession) => {
      if (!supabaseSession) {
        callback(null);
      } else {
        callback({
          user: supabaseSession.user
            ? {
                id: supabaseSession.user.id,
                email: supabaseSession.user.email,
                role:
                  (supabaseSession.user.user_metadata?.role as string) || "admin",
              }
            : null,
          accessToken: supabaseSession.access_token,
          expiresAt: supabaseSession.expires_at,
        });
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }

  // Fallback listener for storage events
  const handleStorage = (e: StorageEvent) => {
    if (e.key === DEV_AUTH_SESSION_KEY) {
      if (e.newValue) {
        callback(JSON.parse(e.newValue));
      } else {
        callback(null);
      }
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }

  return () => {};
}
