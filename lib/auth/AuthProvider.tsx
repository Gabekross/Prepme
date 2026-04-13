"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * Auth loading states — distinguishes between initial boot and role refresh.
 *
 *  initializing  → first load, no session info yet
 *  authenticated → session exists, role check may still be running
 *  ready         → session + roles fully resolved
 *  unauthenticated → no session
 */
type AuthPhase = "initializing" | "authenticated" | "ready" | "unauthenticated";

type AuthState = {
  user: User | null;
  /** True only during the very first session check (before we know anything). */
  loading: boolean;
  /** Granular phase for components that need to distinguish states. */
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

  // Track the latest role-fetch request to avoid stale updates
  const roleFetchId = useRef(0);

  /**
   * Fetch roles for a given user. Guarded against stale/concurrent calls
   * via an incrementing fetch ID.
   */
  async function fetchRoles(u: User) {
    const myFetchId = ++roleFetchId.current;
    try {
      const { data: roles, error } = await sb
        .from("user_roles")
        .select("role")
        .eq("user_id", u.id);

      // Bail if a newer fetch has started
      if (myFetchId !== roleFetchId.current) return;

      if (error) {
        console.warn("[AuthProvider] Role fetch failed:", error.message);
        setIsAdmin(false);
        setIsPro(false);
      } else {
        const roleList = (roles ?? []).map((r: any) => r.role);
        setIsAdmin(roleList.includes("admin"));
        setIsPro(roleList.includes("pro") || roleList.includes("admin"));
      }
    } catch (err) {
      if (myFetchId !== roleFetchId.current) return;
      console.warn("[AuthProvider] Role fetch error:", err);
      setIsAdmin(false);
      setIsPro(false);
    }
    if (myFetchId === roleFetchId.current) {
      setPhase("ready");
    }
  }

  useEffect(() => {
    let mounted = true;

    /**
     * Use onAuthStateChange as the SOLE source of truth.
     *
     * Supabase fires INITIAL_SESSION synchronously when the listener is
     * registered (with the current session from localStorage, or null).
     * Subsequent events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED) fire
     * as the auth state changes.
     *
     * This eliminates the race condition where a separate getUser() call
     * and the listener could return conflicting results.
     */
    const { data: { subscription } } = sb.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        const u = session?.user ?? null;

        console.log("[AuthProvider] Auth event:", event, u?.email ?? "(no user)");

        if (u) {
          setUser(u);
          setPhase("authenticated");
          // Fetch roles — phase moves to "ready" when done
          await fetchRoles(u);
        } else {
          setUser(null);
          setIsAdmin(false);
          setIsPro(false);
          setPhase("unauthenticated");
        }
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

  // loading = true only during initial boot (before we know anything)
  const loading = phase === "initializing";

  const value = useMemo(
    () => ({ user, loading, phase, isAdmin, isPro, signOut }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, phase, isAdmin, isPro]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
