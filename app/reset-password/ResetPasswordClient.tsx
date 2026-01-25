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

const Button = styled.button`
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255,  255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 800;

  &:hover {
    background: rgba(255, 255, 255, 0.10);
  }
`;

const Msg = styled.div`
  font-size: 13px;
  opacity: 0.92;
  line-height: 1.4;
`;

export default function ResetPasswordClient() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function updatePassword() {
    setMsg("Updating password...");
    const { error } = await sb.auth.updateUser({ password });
    if (error) return setMsg(`Update failed: ${error.message}`);
    setMsg("Password updated. Redirecting to login...");
    setTimeout(() => router.push("/login"), 800);
  }

  return (
    <Card>
      <Title>Reset Password</Title>
      <Subtle>Enter a new password. This page is opened from the reset link emailed by Supabase.</Subtle>

      <Row>
        <Label>
          New password
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
        </Label>

        <Button onClick={updatePassword} disabled={!password}>
          Set New Password
        </Button>

        <Msg>{msg}</Msg>
      </Row>
    </Card>
  );
}
