"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * Auth loading phases:
 *  initializing    → first load, no session info yet
 *  authenticated   → session exists, role check may still be running
 *  ready           → session + roles fully resolved
 *  unauthenticated → no session
 */
type AuthPhase = "initializing" | "authenticated" | "ready" | "unauthenticated";

type AuthState = {
  user: User | null;
  /** True only during the very first session check. */
  loading: boolean;
  /** Granular phase for components that need finer state. */
  phase: AuthPhase;
  isAdmin: boolean;
  isPro: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [user, setUser] = useState<User | null>(null);
  const [phase, setPhase] = useState<AuthPhase>("initializing");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPro, setIsPro] = useState(false);

  // Guard against stale role-fetch results
  const roleFetchId = useRef(0);

  async function fetchRoles(u: User) {
    const myId = ++roleFetchId.current;
    try {
      const { data: roles, error } = await sb
        .from("user_roles")
        .select("role")
        .eq("user_id", u.id);

      if (myId !== roleFetchId.current) return;

      if (error) {
        console.warn("[AuthProvider] Role fetch failed:", error.message);
        setIsAdmin(false);
        setIsPro(false);
      } else {
        const list = (roles ?? []).map((r: any) => r.role);
        setIsAdmin(list.includes("admin"));
        setIsPro(list.includes("pro") || list.includes("admin"));
      }
    } catch (err) {
      if (myId !== roleFetchId.current) return;
      console.warn("[AuthProvider] Role fetch error:", err);
      setIsAdmin(false);
      setIsPro(false);
    }
    if (myId === roleFetchId.current) {
      setPhase("ready");
    }
  }

  /**
   * Resolve user & roles from any source (getUser result or session event).
   */
  async function resolveUser(u: User | null) {
    if (u) {
      setUser(u);
      setPhase("authenticated");
      await fetchRoles(u);
    } else {
      setUser(null);
      setIsAdmin(false);
      setIsPro(false);
      setPhase("unauthenticated");
    }
  }

  useEffect(() => {
    let mounted = true;

    // 1. Explicit getUser() — the reliable initial check.
    //    This validates the token server-side and works on every Supabase version.
    sb.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      resolveUser(data.user ?? null);
    }).catch(() => {
      if (!mounted) return;
      setPhase("unauthenticated");
    });

    // 2. Subscribe to auth changes for reactivity (sign-in, sign-out, token refresh).
    //    INITIAL_SESSION is ignored since getUser() already handles the initial state;
    //    this prevents a duplicate role-fetch race.
    const { data: { subscription } } = sb.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        if (event === "INITIAL_SESSION") return; // handled by getUser() above

        console.log("[AuthProvider] Auth event:", event, session?.user?.email ?? "(no user)");
        resolveUser(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await sb.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setIsPro(false);
    setPhase("unauthenticated");
  }

  const loading = phase === "initializing";

  const value = useMemo(
    () => ({ user, loading, phase, isAdmin, isPro, signOut }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, phase, isAdmin, isPro]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
