"use client";

import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

/* ── layout ─────────────────────────────────────────────────────────────── */

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

/* ── form fields ─────────────────────────────────────────────────────────── */

const FieldGroup = styled.div`
  display: grid;
  gap: 14px;
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: grid;
  gap: 7px;
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.theme.mutedStrong};
`;

const Input = styled.input`
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.inputBorder};
  background: ${(p) => p.theme.inputBg};
  color: ${(p) => p.theme.text};
  padding: 10px 14px;
  font-size: 14px;
  outline: none;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &::placeholder {
    color: ${(p) => p.theme.muted};
  }

  &:focus {
    border-color: ${(p) => p.theme.accent};
    box-shadow: 0 0 0 3px ${(p) => p.theme.accentSoft};
  }
`;

/* ── buttons ─────────────────────────────────────────────────────────────── */

const ButtonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const PrimaryButton = styled.button`
  border-radius: 12px;
  border: 1px solid transparent;
  background: ${(p) => p.theme.accent};
  color: white;
  padding: 11px 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms ease, transform 100ms ease, opacity 150ms ease;

  &:hover:not(:disabled) {
    background: ${(p) => p.theme.accentHover};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  padding: 11px 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms ease;

  &:hover:not(:disabled) {
    background: ${(p) => p.theme.buttonHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ── feedback ────────────────────────────────────────────────────────────── */

const Divider = styled.div`
  height: 1px;
  background: ${(p) => p.theme.divider};
  margin: 24px 0;
`;

const Msg = styled.div<{ $type?: "success" | "error" | "info" }>`
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13.5px;
  line-height: 1.5;
  font-weight: 600;
  border: 1px solid ${(p) =>
    p.$type === "success"
      ? p.theme.successBorder
      : p.$type === "error"
      ? p.theme.errorBorder
      : p.theme.cardBorder};
  background: ${(p) =>
    p.$type === "success"
      ? p.theme.successSoft
      : p.$type === "error"
      ? p.theme.errorSoft
      : p.theme.cardBg2};
  color: ${(p) =>
    p.$type === "success"
      ? p.theme.success
      : p.$type === "error"
      ? p.theme.error
      : p.theme.text};
`;

const SectionTitle = styled.h2`
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  letter-spacing: -0.2px;
`;

const OutlineButton = styled.button`
  border-radius: 12px;
  border: 1px solid ${(p) => p.theme.accent}40;
  background: ${(p) => p.theme.accentSoft};
  color: ${(p) => p.theme.accent};
  padding: 11px 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 150ms ease;
  width: 100%;

  &:hover:not(:disabled) {
    background: ${(p) => p.theme.accent};
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

function getMsgType(msg: string): "success" | "error" | "info" {
  if (!msg) return "info";
  const lower = msg.toLowerCase();
  if (lower.includes("failed") || lower.includes("error") || lower.includes("not signed")) return "error";
  if (lower.includes("signed in") || lower.includes("reset email sent") || lower.includes("signed up")) return "success";
  return "info";
}

export default function LoginClient() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function refreshSession() {
    setMsg("");
    const { data } = await sb.auth.getUser();
    const user = data.user;

    if (!user) {
      setMsg("Not signed in.");
      return;
    }

    const { data: roles, error } = await sb.from("user_roles").select("role").eq("user_id", user.id);
    if (error) {
      setMsg(`Signed in, but role check failed: ${error.message}`);
      return;
    }

    const admin = (roles ?? []).some((r: any) => r.role === "admin");
    setMsg(admin ? "Signed in as admin." : "Signed in.");

    if (admin) router.push("/admin/questions");
    else router.push("/");
  }

  async function signIn() {
    if (loading) return;
    setLoading(true);
    setMsg("Signing in…");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setMsg(`Sign in failed: ${error.message}`);
    await refreshSession();
  }

  async function signUp() {
    if (loading) return;
    setLoading(true);
    setMsg("Creating account…");
    const { error } = await sb.auth.signUp({ email, password });
    setLoading(false);
    if (error) return setMsg(`Sign up failed: ${error.message}`);
    setMsg("Account created. Check your email to confirm, then sign in.");
  }

  async function requestPasswordReset() {
    if (loading || !resetEmail) return;
    setLoading(true);
    setMsg("Sending reset email…");
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await sb.auth.resetPasswordForEmail(resetEmail, { redirectTo });
    setLoading(false);
    if (error) return setMsg(`Reset failed: ${error.message}`);
    setMsg("Reset email sent. Check your inbox.");
  }

  React.useEffect(() => {
    refreshSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasCredentials = !!email && !!password;

  return (
    <PageWrap>
      <Card>
        <CardIcon>🔐</CardIcon>
        <Title>Sign In</Title>
        <Subtitle>
          Access admin tools and question management. Admins are redirected automatically.
        </Subtitle>

        <FieldGroup>
          <Label>
            Email address
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Label>

          <Label>
            Password
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              onKeyDown={(e) => e.key === "Enter" && hasCredentials && signIn()}
            />
          </Label>
        </FieldGroup>

        <ButtonRow>
          <PrimaryButton onClick={signIn} disabled={!hasCredentials || loading}>
            {loading ? "Signing in…" : "Sign In"}
          </PrimaryButton>
          <SecondaryButton onClick={signUp} disabled={!hasCredentials || loading}>
            Sign Up
          </SecondaryButton>
        </ButtonRow>

        {msg && (
          <Msg $type={getMsgType(msg)} style={{ marginTop: 14 }}>
            {msg}
          </Msg>
        )}

        <Divider />

        <SectionTitle>Forgot Password?</SectionTitle>

        <Label style={{ marginBottom: 12 }}>
          Email address
          <Input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Label>

        <OutlineButton onClick={requestPasswordReset} disabled={!resetEmail || loading}>
          Send Reset Email
        </OutlineButton>

        <Subtitle style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
          You'll receive a link that opens <strong>/reset-password</strong> where you can set a new password.
        </Subtitle>
      </Card>
    </PageWrap>
  );
}
