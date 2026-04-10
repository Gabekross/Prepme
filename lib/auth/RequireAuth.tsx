"use client";

import React from "react";
import { useAuth } from "./AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import styled, { keyframes } from "styled-components";

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 1; }
`;

const LoadingWrap = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 40vh;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
  font-weight: 600;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

/**
 * Client-side auth guard. Wraps protected pages to redirect
 * unauthenticated users to /login with a returnTo param.
 *
 * Usage:
 * ```tsx
 * <RequireAuth>
 *   <YourProtectedComponent />
 * </RequireAuth>
 * ```
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return <LoadingWrap>Loading...</LoadingWrap>;
  }

  if (!user) {
    // Will redirect in the effect above; show nothing while redirecting
    return <LoadingWrap>Redirecting to sign in...</LoadingWrap>;
  }

  return <>{children}</>;
}
