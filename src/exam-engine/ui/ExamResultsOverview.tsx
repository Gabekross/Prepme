"use client";
import React from "react";
import styled from "styled-components";
import type { AttemptResult, Question } from "../core/types";
import { resultsSummary } from "../core/resultsSummary";

const Page = styled.section`
  max-width: 1100px; margin: 0 auto; min-width: 0; color: ${p => p.theme.text};
  &, *, *::before, *::after { box-sizing: border-box; }
  overflow-wrap: anywhere;
  h1 { margin: 0; font-size: clamp(28px, 5vw, 40px); }
  h2 { margin: 0 0 16px; font-size: 22px; }
  p { margin: 8px 0; }
`;
const Header = styled.header`
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  flex-wrap: wrap; margin-bottom: 24px;
`;
const Card = styled.div`
  background: ${p => p.theme.cardBg}; border: 1px solid ${p => p.theme.cardBorder};
  border-radius: 18px; padding: clamp(18px, 4vw, 30px); min-width: 0;
  box-shadow: ${p => p.theme.shadow};
`;
const Muted = styled.p`color: ${p => p.theme.muted}; font-size: 14px; line-height: 1.6;`;
const Hero = styled.div`display: flex; gap: 28px; align-items: center; flex-wrap: wrap;`;
const Score = styled.div`font-size: clamp(48px, 9vw, 72px); line-height: 1.1; font-weight: 800;`;
const Badge = styled.span`display: inline-block; padding: 8px 14px; border-radius: 24px; background: ${p => p.theme.accentSoft}; font-weight: 700;`;
const Notice = styled.p`padding: 12px 16px; border-radius: 10px; background: ${p => p.theme.warningSoft}; color: ${p => p.theme.text};`;
const Stats = styled.dl`
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 24px 0; gap: 10px;
  div { min-width: 0; } dt { font-size: 14px; color: ${p => p.theme.muted}; }
  dd { margin: 0; font-size: clamp(26px, 5vw, 36px); font-weight: 750; }
`;
const Button = styled.button`
  min-height: 48px; padding: 12px 18px; border-radius: 10px; border: 1px solid ${p => p.theme.accent};
  background: ${p => p.theme.accent}; color: white; font: inherit; font-weight: 700;
  cursor: pointer; white-space: normal; overflow-wrap: anywhere; max-width: 100%;
  &:focus-visible { outline: 3px solid ${p => p.theme.text}; outline-offset: 3px; }
`;
const Primary = styled(Button)`width: 100%; margin-top: 14px;`;
const TextButton = styled(Button)`background: transparent; color: ${p => p.theme.text}; border-color: transparent; text-decoration: underline;`;
const Columns = styled.div`
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin-top: 20px;
  @media(max-width: 700px) { grid-template-columns: minmax(0, 1fr); }
`;
const DomainRow = styled.div`
  margin-bottom: 20px;
  header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 12px; margin-bottom: 8px; }
  progress { width: 100%; height: 12px; accent-color: ${p => p.theme.accent}; }
`;
const Footer = styled.footer`display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px;`;
const labels = { people: "People", process: "Process", business_environment: "Business Environment" };

export function ExamResultsOverview(props: {
  result: AttemptResult; questions: Question[]; passThreshold: number; setLabel: string;
  saved: boolean; timeMs: number; onReview: (missed: boolean) => void;
  onReport: () => void; onRetake: () => void; onPractice: (domain: string) => void;
}) {
  const s = resultsSummary(props.result, props.questions);
  const minutes = Math.floor(props.timeMs / 60000);
  return <Page aria-label="Exam results">
    <Header><div><h1>Your exam results</h1><Muted>PMP Simulation · {props.setLabel}</Muted></div>
      <span role="status">{props.saved ? "✓ Results saved" : "Results available on this device"}</span></Header>
    <Card>
      <Hero><div><Score>{s.percent}%</Score><p>{s.correct} of {s.total} correct</p></div>
        <div><Badge>{s.percent >= props.passThreshold ? "Practice target met" : "Below practice target"}</Badge>
          <Muted>Practice target: {props.passThreshold}% · Not an official exam result.</Muted></div></Hero>
      {s.unanswered > 0 && <Notice>{s.unanswered} unanswered questions count toward your score.</Notice>}
      <Stats><div><dd>{s.correct}</dd><dt>Correct</dt></div><div><dd>{s.incorrect}</dd><dt>Incorrect</dt></div><div><dd>{s.unanswered}</dd><dt>Unanswered</dt></div></Stats>
      <Muted>{s.total - s.unanswered} / {s.total} answered · Time on questions: {minutes} min</Muted>
      {s.missed > 0 && <Primary onClick={() => props.onReview(true)}>Review {s.missed} missed or unanswered →</Primary>}
      <div style={{ textAlign: "center" }}><TextButton onClick={() => props.onReview(false)}>Review all {s.total} questions</TextButton></div>
    </Card>
    <Columns><Card><h2>Performance by domain</h2>
      {Object.entries(s.domains).filter(([,d]) => d.total > 0).map(([key,d]) => {
        const percent = Math.round(d.correct / d.total * 1000) / 10;
        return <DomainRow key={key}><header><strong>{labels[key as keyof typeof labels]}</strong><span>{d.correct} / {d.total} · {percent}%</span></header>
          <progress aria-label={`${labels[key as keyof typeof labels]} correct`} value={d.correct} max={d.total} /></DomainRow>;
      })}<Muted>Includes unanswered questions.</Muted></Card>
      <Card><h2>Your next study step</h2>
        {s.limited ? <><strong>Limited evidence</strong><Muted>Complete more questions before assessing readiness. Review the explanations for this attempt first.</Muted></>
        : s.missed === 0 ? <><strong>Build on this result</strong><Muted>Review any answers you were unsure about, then try another simulation.</Muted></>
        : <><strong>Start with {s.weakest ? labels[s.weakest] : "your missed questions"}</strong><Muted>Review the explanations, then try a focused practice session.</Muted>
          {s.weakest && <Button onClick={() => props.onPractice(s.weakest!)}>Practice this domain</Button>}</>}
      </Card></Columns>
    <Footer>{props.saved && <TextButton onClick={props.onReport}>Detailed report</TextButton>}<TextButton onClick={props.onRetake}>Take another simulation</TextButton></Footer>
  </Page>;
}
