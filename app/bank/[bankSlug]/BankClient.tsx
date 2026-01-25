"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Bank = { id: string; slug: string; name: string; description: string | null };

const Header = styled.div`
  display: grid;
  gap: 8px;
  margin-bottom: 14px;
`;

const H1 = styled.h1`
  margin: 0;
  font-size: 26px;
  letter-spacing: -0.3px;
  color: ${(p) => p.theme.text};
`;

const P = styled.p`
  margin: 0;
  color: ${(p) => p.theme.muted};
  font-size: 14px;
  line-height: 1.5;
`;

const Grid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;

  @media (min-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Card = styled(Link)`
  text-decoration: none;
  color: inherit;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 18px;
  padding: 14px;
  box-shadow: ${(p) => p.theme.shadow};
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: -40px -40px auto auto;
    width: 240px;
    height: 240px;
    background: radial-gradient(circle at 30% 30%, ${(p) => p.theme.accentSoft}, transparent 65%);
    transform: rotate(10deg);
    pointer-events: none;
  }

  &:hover {
    background: ${(p) => p.theme.buttonHover};
    transform: translateY(-1px);
  }

  transition: background 160ms ease, transform 160ms ease;
`;

const Name = styled.div`
  font-weight: 950;
  font-size: 16px;
  color: ${(p) => p.theme.text};
`;

const Meta = styled.div`
  margin-top: 6px;
  color: ${(p) => p.theme.muted};
  font-size: 13px;
  line-height: 1.45;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.buttonBg};
  font-size: 12px;
  font-weight: 900;
  color: ${(p) => p.theme.text};
  margin-top: 10px;

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: ${(p) => p.theme.accent};
  }
`;

export default function BankClient({ bankSlug }: { bankSlug: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [bank, setBank] = useState<Bank | null>(null);
  const [msg, setMsg] = useState("Loading…");

  useEffect(() => {
    (async () => {
      const { data, error } = await sb
        .from("question_banks")
        .select("id,slug,name,description")
        .eq("slug", bankSlug)
        .single();

      if (error) {
        setMsg(`Bank not found: ${error.message}`);
        return;
      }

      setBank(data as any);
      setMsg("");
    })();
  }, [sb, bankSlug]);

  if (msg) return <P>{msg}</P>;
  if (!bank) return null;

  return (
    <>
      <Header>
        <H1>{bank.name}</H1>
        <P>{bank.description ?? "Choose a mode to begin."}</P>
      </Header>

      <Grid>
        <Card href={`/bank/${bank.slug}/practice`}>
          <Name>Practice</Name>
          <Meta>Immediate feedback after submit. Great for learning and drills.</Meta>
          <Badge>Start practice</Badge>
        </Card>

        <Card href={`/bank/${bank.slug}/exam`}>
          <Name>Exam Simulation</Name>
          <Meta>Exam-style flow. Submit at the end for your results (timer coming next).</Meta>
          <Badge>Start simulation</Badge>
        </Card>
      </Grid>
    </>
  );
}
