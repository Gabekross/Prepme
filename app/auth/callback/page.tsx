"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import styled, { keyframes } from "styled-components";
import Link from "next/link";

/**
 * /auth/callback — Client-side auth finalization page.
 *
 * When a user clicks the email confirmation (or password reset) link,
 * Supabase redirects here with a `code` query param (PKCE flow).
 *
 * This page exchanges the code for a session using the BROWSER Supabase
 * client, which stores the resulting tokens in localStorage. This is
 * critical — a server-side exchange would discard the tokens.
 *
 * After a successful exchange, it redirects to the app.
 */

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 1; }
`;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  gap: 16px;
  padding: 24px;
`;

const StatusMsg = styled.div<{ $error?: boolean }>`
  font-size: 16px;
  font-weight: 700;
  color: ${(p) => (p.$error ? p.theme.error : p.theme.text)};
  animation: ${pulse} 1.5s ease-in-out infinite;
  ${(p) => p.$error && "animation: none;"}
`;

const SubMsg = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  line-height: 1.5;
  max-width: 400px;
`;

const RetryLink = styled(Link)`
  font-size: 14px;
  font-weight: 700;
  color: ${(p) => p.theme.accent};
  text-decoration: none;
  margin-top: 8px;
  &:hover { text-decoration: underline; }
`;

type Status = "processing" | "success" | "error";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("processing");
  const [errorMsg, setErrorMsg] = useState("");
  const exchangeAttempted = useRef(false);

  useEffect(() => {
    // Guard against double-execution in React StrictMode
    if (exchangeAttempted.current) return;
    exchangeAttempted.current = true;

    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/bank/pmp";
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Supabase sent an error (e.g. expired link)
    if (error) {
      console.error("[auth/callback] Supabase error:", error, errorDescription);
      setStatus("error");
      setErrorMsg(errorDescription ?? error);
      return;
    }

    // No code — might be implicit flow with hash fragments.
    // The Supabase browser client auto-detects hash tokens on init,
    // so just redirect to the destination.
    if (!code) {
      console.log("[auth/callback] No code param, redirecting to:", next);
      window.location.replace(next);
      return;
    }

    // Exchange the PKCE code for a session using the browser client.
    // This stores tokens in localStorage so the rest of the app can use them.
    const sb = supabaseBrowser();

    sb.auth
      .exchangeCodeForSession(code)
      .then(({ data, error: exchangeError }) => {
        if (exchangeError) {
          console.error("[auth/callback] Code exchange failed:", exchangeError.message);
          setStatus("error");
          setErrorMsg(exchangeError.message);
          return;
        }

        console.log(
          "[auth/callback] Session established for:",
          data.session?.user?.email ?? "unknown"
        );
        setStatus("success");

        // Full-page navigation ensures AuthProvider re-initializes with the
        // new session from localStorage. Using replace to keep back-button clean.
        window.location.replace(next);
      })
      .catch((err) => {
        console.error("[auth/callback] Unexpected error:", err);
        setStatus("error");
        setErrorMsg("An unexpected error occurred. Please try signing in manually.");
      });
  }, [searchParams]);

  if (status === "error") {
    return (
      <Wrap>
        <StatusMsg $error>Sign-in failed</StatusMsg>
        <SubMsg>{errorMsg || "Something went wrong during authentication."}</SubMsg>
        <RetryLink href="/login">Go to Sign In</RetryLink>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <StatusMsg>
        {status === "success" ? "Confirmed! Redirecting..." : "Confirming your account..."}
      </StatusMsg>
      <SubMsg>Please wait while we set up your session.</SubMsg>
    </Wrap>
  );
}
