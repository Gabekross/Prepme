"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import styled, { keyframes } from "styled-components";
import Link from "next/link";

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

export default function CallbackClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("processing");
  const [errorMsg, setErrorMsg] = useState("");
  const exchangeAttempted = useRef(false);

  useEffect(() => {
    if (exchangeAttempted.current) return;
    exchangeAttempted.current = true;

    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/bank/pmp";
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const isPasswordReset = next === "/reset-password";

    if (error) {
      console.error("[auth/callback] Supabase error:", error, errorDescription);
      setStatus("error");
      setErrorMsg(errorDescription ?? error);
      return;
    }

    const sb = supabaseBrowser();

    if (code) {
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
          window.location.replace(next);
        })
        .catch((err) => {
          console.error("[auth/callback] Unexpected error:", err);
          setStatus("error");
          setErrorMsg("An unexpected error occurred. Please try signing in manually.");
        });
      return;
    }

    // No code param — check for implicit/hash-fragment flow.
    // Hash fragments (#access_token=...&type=recovery) are used by some
    // Supabase configurations. The browser client auto-detects them on init,
    // but we need to wait for that async detection to finish.
    const hash = window.location.hash;
    if (hash && (hash.includes("access_token") || hash.includes("type=recovery"))) {
      console.log("[auth/callback] Hash fragments detected, waiting for session…");

      const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") {
          console.log("[auth/callback] Session from hash fragments:", event);
          subscription.unsubscribe();
          setStatus("success");
          window.location.replace(next);
        }
      });

      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        // One last check — the session might have been set before our listener.
        sb.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setStatus("success");
            window.location.replace(next);
          } else {
            setStatus("error");
            setErrorMsg(
              isPasswordReset
                ? "Reset link expired or already used. Please request a new password reset."
                : "Could not establish a session. Please try signing in again."
            );
          }
        });
      }, 5000);

      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    }

    // No code, no hash fragments — might be a direct navigation.
    // Check if there's already an active session (e.g. from a previous login).
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.replace(next);
      } else {
        console.log("[auth/callback] No code, no hash, no session — redirecting to:", next);
        window.location.replace(next);
      }
    });
  }, [searchParams]);

  if (status === "error") {
    const isPasswordReset = (searchParams.get("next") ?? "").includes("reset-password");
    return (
      <Wrap>
        <StatusMsg $error>
          {isPasswordReset ? "Reset link failed" : "Sign-in failed"}
        </StatusMsg>
        <SubMsg>{errorMsg || "Something went wrong during authentication."}</SubMsg>
        <RetryLink href={isPasswordReset ? "/forgot-password" : "/login"}>
          {isPasswordReset ? "Request a new reset link" : "Go to Sign In"}
        </RetryLink>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <StatusMsg>
        {status === "success" ? "Confirmed! Redirecting…" : "Confirming your account…"}
      </StatusMsg>
      <SubMsg>Please wait while we set up your session.</SubMsg>
    </Wrap>
  );
}
