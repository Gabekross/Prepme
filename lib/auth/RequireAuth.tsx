"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import styled, { keyframes } from "styled-components";

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 1; }
`;

const LoadingWrap = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 40vh;
  gap: 12px;
`;

const LoadingText = styled.div`
  color: ${(p) => p.theme.muted};
  font-size: 14px;
  font-weight: 600;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const ErrorText = styled.div`
  color: ${(p) => p.theme.error};
  font-size: 14px;
  font-weight: 600;
`;

const RetryBtn = styled.button`
  padding: 8px 20px;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.cardBg};
  color: ${(p) => p.theme.text};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  &:hover { background: ${(p) => p.theme.buttonHover}; }
`;

/** Maximum seconds to wait for auth to resolve before showing an error. */
const AUTH_TIMEOUT_MS = 12_000;

/**
 * Client-side auth guard. Wraps protected pages to redirect
 * unauthenticated users to /login with a returnTo param.
 *
 * Shows a loading state during auth initialization. If auth takes too long
 * (network issue, stuck session), shows an error with a retry option instead
 * of hanging forever on "Loading...".
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, phase } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [timedOut, setTimedOut] = useState(false);

  // Timeout: if auth stays in "initializing" too long, show an error
  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user) {
      console.log("[RequireAuth] No session, redirecting to /login from:", pathname);
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  // Auth still initializing
  if (loading) {
    if (timedOut) {
      return (
        <LoadingWrap>
          <ErrorText>Taking too long to verify your session.</ErrorText>
          <RetryBtn onClick={() => window.location.reload()}>
            Retry
          </RetryBtn>
        </LoadingWrap>
      );
    }
    return <LoadingWrap><LoadingText>Loading...</LoadingText></LoadingWrap>;
  }

  // Not authenticated — redirect is happening via the effect above
  if (!user) {
    return <LoadingWrap><LoadingText>Redirecting to sign in...</LoadingText></LoadingWrap>;
  }

  // User exists. We can render children immediately — roles are still loading
  // in the background (phase === "authenticated") but the page content is
  // accessible. Components that need isPro/isAdmin will get updated reactively.
  return <>{children}</>;
}
