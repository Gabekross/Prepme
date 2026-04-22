"use client";

import React, { useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { supabaseBrowser } from "@/lib/supabase/browser";
import Link from "next/link";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const PageWrap = styled.div`
  display: flex;
  justify-content: center;
  padding: 32px 16px 64px;
  animation: ${fadeUp} 400ms ease both;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 24px;
  padding: 32px;
  box-shadow: ${(p) => p.theme.shadowLg};
  position: relative;
  overflow: hidden;

  @media (max-width: 480px) {
    padding: 28px 20px;
    border-radius: 20px;
  }

  &::before {
    content: "";
    position: absolute;
    top: -60px;
    right: -60px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle at center, ${(p) => p.theme.accentSoft}, transparent 70%);
    pointer-events: none;
  }
`;


const Title = styled.h1`
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.4px;
  color: ${(p) => p.theme.text};
`;

const Subtitle = styled.p`
  margin: 0 0 24px;
  font-size: 14px;
  color: ${(p) => p.theme.muted};
  line-height: 1.5;
  overflow-wrap: break-word;
`;

const Label = styled.label`
  display: grid;
  gap: 7px;
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.mutedStrong};
  margin-bottom: 16px;
`;

const Input = styled.input`
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.inputBorder};
  background: ${(p) => p.theme.inputBg};
  color: ${(p) => p.theme.text};
  padding: 11px 14px;
  font-size: 14px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &::placeholder { color: ${(p) => p.theme.muted}; }
  &:focus {
    border-color: ${(p) => p.theme.accent};
    box-shadow: 0 0 0 3px ${(p) => p.theme.accentSoft};
  }
`;

const SubmitBtn = styled.button`
  width: 100%;
  border-radius: 12px;
  border: 1px solid transparent;
  background: linear-gradient(135deg, ${(p) => p.theme.accent}, #7c3aed);
  color: white;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 150ms ease, transform 100ms ease;

  &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const Msg = styled.div<{ $type?: "success" | "error" | "info" }>`
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13.5px;
  line-height: 1.5;
  font-weight: 600;
  border: 1px solid ${(p) =>
    p.$type === "success" ? p.theme.successBorder
    : p.$type === "error" ? p.theme.errorBorder
    : p.theme.cardBorder};
  background: ${(p) =>
    p.$type === "success" ? p.theme.successSoft
    : p.$type === "error" ? p.theme.errorSoft
    : p.theme.cardBg2};
  color: ${(p) =>
    p.$type === "success" ? p.theme.success
    : p.$type === "error" ? p.theme.error
    : p.theme.text};
`;

const BackLink = styled(Link)`
  display: block;
  margin-top: 16px;
  text-align: center;
  font-size: 13px;
  color: ${(p) => p.theme.accent};
  font-weight: 700;
  text-decoration: none;

  &:hover { text-decoration: underline; }
`;

export default function ForgotPasswordPage() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (loading || !email) return;
    setLoading(true);
    setMsg("Sending reset link...");

    const origin = typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);
    if (error) {
      setMsg(`Failed: ${error.message}`);
      return;
    }
    setSent(true);
    setMsg("Check your email for a password reset link. It may take a minute to arrive.");
  }

  return (
    <PageWrap>
      <Card>
        <Title>Reset Password</Title>
        <Subtitle>
          Enter your email address and we will send you a link to reset your password.
        </Subtitle>

        {!sent ? (
          <>
            <Label>
              Email address
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                onKeyDown={(e) => e.key === "Enter" && email && handleSubmit()}
              />
            </Label>

            <SubmitBtn onClick={handleSubmit} disabled={!email || loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </SubmitBtn>
          </>
        ) : null}

        {msg && (
          <Msg $type={msg.includes("Failed") ? "error" : sent ? "success" : "info"}>
            {msg}
          </Msg>
        )}

        <BackLink href="/login">&larr; Back to sign in</BackLink>
      </Card>
    </PageWrap>
  );
}
