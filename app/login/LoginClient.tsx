"use client";

import React, { useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

/* ── animations ─────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── layout ─────────────────────────────────────────────────────────────── */

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

/* ── tabs ────────────────────────────────────────────────────────────────── */

const TabRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  margin-bottom: 24px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid ${(p) => p.theme.cardBorder};
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 11px 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 150ms ease;
  background: ${(p) => (p.$active ? p.theme.accent : p.theme.buttonBg)};
  color: ${(p) => (p.$active ? "white" : p.theme.muted)};

  &:hover:not(:disabled) {
    background: ${(p) => (p.$active ? p.theme.accent : p.theme.buttonHover)};
    color: ${(p) => (p.$active ? "white" : p.theme.text)};
  }
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

/* ── buttons ─────────────────────────────────────────────────────────────── */

const PrimaryButton = styled.button`
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

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

/* ── feedback ────────────────────────────────────────────────────────────── */

const Msg = styled.div<{ $type?: "success" | "error" | "info" }>`
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13.5px;
  line-height: 1.5;
  font-weight: 600;
  margin-top: 14px;
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

const LinkRow = styled.div`
  margin-top: 16px;
  text-align: center;
  font-size: 13px;
  color: ${(p) => p.theme.muted};
`;

const TextLink = styled(Link)`
  color: ${(p) => p.theme.accent};
  font-weight: 700;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const PasswordHint = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  margin-top: -6px;
`;

/* ── helpers ─────────────────────────────────────────────────────────────── */

function getMsgType(msg: string): "success" | "error" | "info" {
  if (!msg) return "info";
  const lower = msg.toLowerCase();
  if (lower.includes("failed") || lower.includes("error") || lower.includes("invalid")) return "error";
  if (lower.includes("check your email") || lower.includes("signed in") || lower.includes("redirecting") || lower.includes("created")) return "success";
  return "info";
}

function getOrigin() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/* ── component ──────────────────────────────────────────────────────────── */

export default function LoginClient() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function refreshSession() {
    setMsg("");
    const { data } = await sb.auth.getUser();
    const user = data.user;

    if (!user) {
      console.log("[LoginClient] refreshSession: no user session found");
      return;
    }
    console.log("[LoginClient] refreshSession: user found:", user.email);

    const { data: roles, error } = await sb.from("user_roles").select("role").eq("user_id", user.id);
    if (error) {
      setMsg(`Signed in, but role check failed: ${error.message}`);
      return;
    }

    const admin = (roles ?? []).some((r: any) => r.role === "admin");
    setMsg(admin ? "Signed in as admin. Redirecting..." : "Signed in. Redirecting...");

    await new Promise((r) => setTimeout(r, 300));

    const destination = admin ? "/admin/questions" : (returnTo ?? "/bank/pmp");
    window.location.href = destination;
  }

  async function signIn() {
    if (loading) return;
    setLoading(true);
    setMsg("Signing in...");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setMsg(`Sign in failed: ${error.message}`);
    await refreshSession();
  }

  async function signUp() {
    if (loading) return;

    if (password.length < 6) {
      return setMsg("Password must be at least 6 characters.");
    }

    if (password !== confirmPassword) {
      return setMsg("Passwords do not match.");
    }

    setLoading(true);
    setMsg("Creating account...");

    const origin = getOrigin();
    const { error } = await sb.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/welcome`,
      },
    });

    setLoading(false);
    if (error) return setMsg(`Sign up failed: ${error.message}`);
    setMsg("Check your email for a confirmation link. Once confirmed, come back and sign in.");
  }

  React.useEffect(() => {
    refreshSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasSignInFields = !!email && !!password;
  const hasSignUpFields = !!email && !!password && !!confirmPassword;

  return (
    <PageWrap>
      <Card>
        <CardIcon>{tab === "signin" ? "\uD83D\uDD10" : "\uD83D\uDE80"}</CardIcon>
        <Title>{tab === "signin" ? "Welcome Back" : "Create Account"}</Title>
        <Subtitle>
          {tab === "signin"
            ? "Sign in to continue your PMP exam preparation."
            : "Create a free account to track your progress and access exam simulations."}
        </Subtitle>

        <TabRow>
          <Tab $active={tab === "signin"} onClick={() => { setTab("signin"); setMsg(""); }}>
            Sign In
          </Tab>
          <Tab $active={tab === "signup"} onClick={() => { setTab("signup"); setMsg(""); }}>
            Create Account
          </Tab>
        </TabRow>

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
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tab === "signin" && hasSignInFields) signIn();
              }}
            />
          </Label>

          {tab === "signup" && (
            <>
              <Label>
                Confirm password
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && hasSignUpFields) signUp();
                  }}
                />
              </Label>
              <PasswordHint>
                Minimum 6 characters
              </PasswordHint>
            </>
          )}
        </FieldGroup>

        {tab === "signin" ? (
          <PrimaryButton onClick={signIn} disabled={!hasSignInFields || loading}>
            {loading ? "Signing in..." : "Sign In"}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={signUp} disabled={!hasSignUpFields || loading}>
            {loading ? "Creating account..." : "Create Free Account"}
          </PrimaryButton>
        )}

        {msg && <Msg $type={getMsgType(msg)}>{msg}</Msg>}

        {tab === "signin" && (
          <LinkRow>
            <TextLink href="/forgot-password">Forgot your password?</TextLink>
          </LinkRow>
        )}

        {tab === "signin" && (
          <LinkRow>
            Don&apos;t have an account?{" "}
            <TextLink href="#" onClick={(e) => { e.preventDefault(); setTab("signup"); setMsg(""); }}>
              Sign up for free
            </TextLink>
          </LinkRow>
        )}

        {tab === "signup" && (
          <LinkRow>
            Already have an account?{" "}
            <TextLink href="#" onClick={(e) => { e.preventDefault(); setTab("signin"); setMsg(""); }}>
              Sign in
            </TextLink>
          </LinkRow>
        )}
      </Card>
    </PageWrap>
  );
}
