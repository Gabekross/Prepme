"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/browser";

type AuthState = {
  user: User | null;
  loading: boolean;
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
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPro, setIsPro] = useState(false);

  async function checkUser() {
    try {
      const { data } = await sb.auth.getUser();
      const u = data.user;
      setUser(u ?? null);

      if (u) {
        const { data: roles } = await sb
          .from("user_roles")
          .select("role")
          .eq("user_id", u.id);
        const roleList = (roles ?? []).map((r: any) => r.role);
        setIsAdmin(roleList.includes("admin"));
        setIsPro(roleList.includes("pro") || roleList.includes("admin"));
      } else {
        setIsAdmin(false);
        setIsPro(false);
      }
    } catch {
      setUser(null);
      setIsAdmin(false);
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkUser();

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsAdmin(false);
        setIsPro(false);
      } else {
        // Re-check admin role on sign-in
        checkUser();
      }
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await sb.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setIsPro(false);
  }

  const value = useMemo(
    () => ({ user, loading, isAdmin, isPro, signOut }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, isAdmin, isPro]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
