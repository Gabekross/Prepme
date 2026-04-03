"use client";

import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

const PageWrap = styled.div`
  display: flex;
  justify-content: center;
  padding: 32px 16px 64px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 440px;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 24px;
  padding: 32px;
  box-shadow: ${(p) => p.theme.shadowLg};
  position: relative;
  overflow: hidden;

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

const CardIcon = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 18px;
  background: linear-gradient(135deg, ${(p) => p.theme.accent} 0%, #7c3aed 100%);
  display: grid;
  place-items: center;
  font-size: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px ${(p) => p.theme.accentSoft};
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

  &::placeholder {
    color: ${(p) => p.theme.muted};
  }

  &:focus {
    border-color: ${(p) => p.theme.accent};
    box-shadow: 0 0 0 3px ${(p) => p.theme.accentSoft};
  }
`;

const SubmitBtn = styled.button`
  width: 100%;
  border-radius: 12px;
  border: 1px solid transparent;
  background: ${(p) => p.theme.accent};
  color: white;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms ease, opacity 150ms ease;

  &:hover:not(:disabled) {
    background: ${(p) => p.theme.accentHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Msg = styled.div<{ $error?: boolean }>`
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13.5px;
  line-height: 1.5;
  font-weight: 600;
  background: ${(p) => (p.$error ? p.theme.errorSoft : p.theme.successSoft)};
  color: ${(p) => (p.$error ? p.theme.error : p.theme.success)};
  border: 1px solid ${(p) => (p.$error ? p.theme.errorBorder : p.theme.successBorder)};
`;

export default function ResetPasswordClient() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function updatePassword() {
    if (!password || loading) return;
    setLoading(true);
    setMsg("Updating password…");
    setIsError(false);
    const { error } = await sb.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setIsError(true);
      return setMsg(`Update failed: ${error.message}`);
    }
    setMsg("Password updated! Redirecting to sign in…");
    setTimeout(() => router.push("/login"), 1200);
  }

  return (
    <PageWrap>
      <Card>
        <CardIcon>🔑</CardIcon>
        <Title>Set New Password</Title>
        <Subtitle>
          Enter your new password below. This page was opened from the reset link sent to your email.
        </Subtitle>

        <Label>
          New password
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            onKeyDown={(e) => e.key === "Enter" && password && updatePassword()}
          />
        </Label>

        <SubmitBtn onClick={updatePassword} disabled={!password || loading}>
          {loading ? "Updating…" : "Set New Password"}
        </SubmitBtn>

        {msg && <Msg $error={isError}>{msg}</Msg>}
      </Card>
    </PageWrap>
  );
}
