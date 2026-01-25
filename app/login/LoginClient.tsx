"use client";

import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

const Card = styled.div`
  max-width: 520px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 16px;
`;

const Title = styled.h1`
  margin: 0 0 10px 0;
  font-size: 18px;
`;

const Subtle = styled.p`
  margin: 0 0 12px 0;
  font-size: 13px;
  opacity: 0.85;
  line-height: 1.45;
`;

const Row = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 12px;
`;

const Label = styled.label`
  display: grid;
  gap: 6px;
  font-size: 12px;
  opacity: 0.9;
`;

const Input = styled.input`
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  outline: none;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
`;

const Button = styled.button`
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 800;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Msg = styled.div`
  font-size: 13px;
  opacity: 0.92;
  line-height: 1.4;
`;

const Code = styled.code`
  display: block;
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.9;
  background: rgba(0, 0, 0, 0.25);
  padding: 10px;
  border-radius: 12px;
  overflow: auto;
`;

console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("ANON_KEY first 12:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 12));


export default function LoginClient() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [resetEmail, setResetEmail] = useState("");

  const [msg, setMsg] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  async function refreshSession() {
    setMsg("");
    const { data } = await sb.auth.getUser();
    const user = data.user;

    if (!user) {
      setUserId("");
      setIsAdmin(false);
      setMsg("Not signed in.");
      return;
    }

    setUserId(user.id);

    // Check admin role
    const { data: roles, error } = await sb.from("user_roles").select("role").eq("user_id", user.id);
    if (error) {
      setIsAdmin(false);
      setMsg(`Signed in, but role check failed: ${error.message}`);
      return;
    }

    const admin = (roles ?? []).some((r: any) => r.role === "admin");
    setIsAdmin(admin);
    setMsg(admin ? "Signed in as ADMIN ✅" : "Signed in (not admin).");

    // Auto-redirect
    if (admin) router.push("/admin/questions");
    else router.push("/engine");
  }

  async function signIn() {
    setMsg("Signing in...");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return setMsg(`Sign in failed: ${error.message}`);
    await refreshSession();
  }

  async function signUp() {
    setMsg("Signing up...");
    const { error } = await sb.auth.signUp({ email, password });
    if (error) return setMsg(`Sign up failed: ${error.message}`);
    setMsg("Signed up. Check email confirmation if your project requires it. Now try signing in.");
  }

  async function signOut() {
    setMsg("Signing out...");
    const { error } = await sb.auth.signOut();
    if (error) return setMsg(`Sign out failed: ${error.message}`);
    setUserId("");
    setIsAdmin(false);
    setMsg("Signed out.");
  }

  async function requestPasswordReset() {
    setMsg("Sending password reset email...");
    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await sb.auth.resetPasswordForEmail(resetEmail, { redirectTo });
    if (error) return setMsg(`Reset failed: ${error.message}`);

    setMsg("Reset email sent. Check your inbox.");
  }

  React.useEffect(() => {
    refreshSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <Title>Login</Title>
      <Subtle>
        Sign in for admin tools (question upload). Admins will be redirected to <b>/admin/questions</b>.
      </Subtle>

      <Row>
        <Label>
          Email
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </Label>

        <Label>
          Password
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" type="password" />
        </Label>

        <ButtonRow>
          <Button onClick={signIn} disabled={!email || !password}>
            Sign In
          </Button>
          <Button onClick={signUp} disabled={!email || !password}>
            Sign Up
          </Button>
          <Button onClick={signOut}>Sign Out</Button>
          <Button onClick={refreshSession}>Refresh Session</Button>
        </ButtonRow>

        <Msg>{msg}</Msg>

        {userId ? (
          <Code>
            userId: {userId}
            {"\n"}admin: {String(isAdmin)}
          </Code>
        ) : null}
      </Row>

      <Row>
        <Title style={{ fontSize: 16, marginTop: 10 }}>Password Reset</Title>

        <Label>
          Reset email
          <Input value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="you@email.com" />
        </Label>

        <ButtonRow>
          <Button onClick={requestPasswordReset} disabled={!resetEmail}>
            Send Reset Email
          </Button>
        </ButtonRow>

        <Subtle>
          You’ll receive a link that opens <b>/reset-password</b> in this app. After setting a new password, you can sign
          in again.
        </Subtle>
      </Row>
    </Card>
  );
}
