"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import type { Attempt, AttemptResult, Question } from "../core/types";
import { buildDetailedReport, filterReportRows, REPORT_DOMAINS, type ReportFilter } from "../core/detailedReport";

const Page = styled.div`
  max-width: 1120px; margin: auto; min-width: 0; color: ${p => p.theme.text}; overflow-wrap: anywhere;
  &, *, *::before, *::after { box-sizing: border-box; }
  h1 { font-size: clamp(26px, 4vw, 38px); margin: 12px 0 4px; }
  h2 { font-size: 21px; margin: 0 0 18px; }
  h3 { font-size: 16px; margin: 0 0 8px; }
  a { color: ${p => p.theme.accent}; }
  button, input, select { font: inherit; }
  a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible { outline: 3px solid ${p => p.theme.accent}; outline-offset: 3px; }
  section { scroll-margin-top: 90px; }
`;
const Header = styled.header`display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 18px; margin-bottom: 20px;`;
const Card = styled.section`padding: clamp(16px, 3vw, 26px); background: ${p => p.theme.cardBg}; border: 1px solid ${p => p.theme.cardBorder}; border-radius: 16px; min-width: 0; margin-bottom: 20px;`;
const Muted = styled.p`font-size: 14px; line-height: 1.6; color: ${p => p.theme.muted}; margin: 8px 0;`;
const Action = styled(Link)`
  && { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; max-width: 100%;
    padding: 12px 16px; background: ${p => p.theme.accent}; color: white; border-radius: 9px; text-decoration: none; font-weight: 700; }
`;
const Button = styled.button`
  cursor: pointer; min-height: 44px; padding: 9px 13px; border: 1px solid ${p => p.theme.cardBorder};
  border-radius: 8px; background: ${p => p.theme.cardBg}; color: ${p => p.theme.text}; max-width: 100%; white-space: normal;
  &[aria-pressed="true"] { background: ${p => p.theme.accentSoft}; border-color: ${p => p.theme.accent}; }
`;
const Summary = styled.dl`
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin: 0;
  dt { font-size: 13px; color: ${p => p.theme.muted}; } dd { margin: 4px 0 0; font-size: 28px; font-weight: 800; }
  @media(max-width: 540px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;
const Nav = styled.nav`display: flex; flex-wrap: wrap; gap: 8px 22px; margin: 12px 0 24px; a { padding: 12px 0; }`;
const Columns = styled.div`display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 20px; @media(max-width: 760px) { grid-template-columns: minmax(0, 1fr); gap: 0; }`;
const Domain = styled.div`margin: 18px 0; header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; } progress { width: 100%; height: 14px; accent-color: ${p => p.theme.accent}; margin-top: 8px; }`;
const TopicRow = styled.div`
  display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
  align-items: center; gap: 12px; padding: 16px 0; border-top: 1px solid ${p => p.theme.cardBorder};
  @media(max-width: 640px) { grid-template-columns: repeat(2, minmax(0, 1fr)); > :first-child { grid-column: 1 / -1; } }
`;
const Controls = styled.div`
  display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0;
  label { display: grid; gap: 6px; flex: 1 1 200px; min-width: 0; }
  input, select { width: 100%; min-width: 0; min-height: 44px; padding: 10px; border-radius: 8px; border: 1px solid ${p => p.theme.cardBorder}; background: ${p => p.theme.cardBg}; color: ${p => p.theme.text}; }
`;
const QuestionRow = styled.article`padding: 18px 0; border-top: 1px solid ${p => p.theme.cardBorder}; header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; } p { line-height: 1.5; }`;
const Footer = styled.footer`display: flex; align-items: center; flex-wrap: wrap; gap: 18px; padding-bottom: 24px;`;
const PAGE_SIZE = 20;
function duration(ms: number | null) { if (ms === null) return "Not recorded"; const s = Math.round(ms / 1000); return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`; }

export function DetailedResultsReport({ attemptId, bankSlug, setLabel, mode, submittedAt, state, result, questions }: {
  attemptId: string; bankSlug: string; setLabel: string; mode: "exam" | "practice"; submittedAt: string | null;
  state: Attempt; result: AttemptResult; questions: Question[];
}) {
  const report = useMemo(() => buildDetailedReport(result, questions, state), [result, questions, state]);
  const [filter, setFilter] = useState<ReportFilter>("all");
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("missed");
  const [copyMessage, setCopyMessage] = useState("");
  const s = report.summary;
  const rows = filterReportRows(report.rows, filter, search, topic);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const activePage = Math.min(page, pageCount - 1);
  const topics = [...report.topics].sort((a, b) => sort === "accuracy" ? a.correct / a.total - b.correct / b.total : b.missed - a.missed || b.total - a.total);
  const recommended = report.topics.find(item => item.total >= 5 && item.missed > 0 && !item.key.endsWith(":other"));
  const reviewUrl = `/dashboard/results/${encodeURIComponent(attemptId)}/review`;
  const threshold = state.blueprint?.passThreshold ?? 70;
  const flaggedCount = report.rows.filter(row => row.flagged).length;
  const filters: [ReportFilter, string, number][] = [["all", "All", report.rows.length], ["incorrect", "Incorrect", s.incorrect], ["unanswered", "Unanswered", s.unanswered], ["flagged", "Flagged", flaggedCount], ["missed", "Missed or unanswered", s.missed]];

  return <Page>
    <nav aria-label="Breadcrumb"><Link href="/dashboard">Dashboard</Link> / {setLabel} / Detailed report</nav>
    <Header><div><h1>Understand your performance</h1><Muted>{mode === "exam" ? "Exam simulation" : "Practice session"} · {setLabel}{submittedAt ? ` · ${new Date(submittedAt).toLocaleString()}` : ""}</Muted></div>
      <Action href={`${reviewUrl}${s.missed ? "?filter=missed" : ""}`}>{s.missed ? `Review ${s.missed} missed or unanswered →` : "Review all questions →"}</Action></Header>
    <Card aria-label="Score summary"><Summary><div><dt>Overall score</dt><dd>{s.percent}%</dd></div><div><dt>Correct</dt><dd>{s.correct}</dd></div><div><dt>Incorrect</dt><dd>{s.incorrect}</dd></div><div><dt>Unanswered</dt><dd>{s.unanswered}</dd></div></Summary>
      <Muted>{s.total - s.unanswered} / {s.total} answered. Practice target: {threshold}% · Not an official exam result.</Muted>
      {s.unanswered > 0 && <Muted>Unanswered questions count toward the overall score.</Muted>}
      {!report.complete && <p role="alert">Some historical scoring or question data is unavailable. Interpret this report with caution.</p>}
    </Card>
    <Nav aria-label="Report sections"><a href="#domains">Domains &amp; topics</a><a href="#pacing">Pacing</a><a href="#questions">Question explorer</a></Nav>
    <Columns><Card id="domains"><h2>Performance by domain</h2>{Object.entries(s.domains).filter(([,d]) => d.total).map(([key,d]) => <Domain key={key}><header><strong>{REPORT_DOMAINS[key as keyof typeof REPORT_DOMAINS]}</strong><span>{d.correct} / {d.total} · {Math.round(d.correct / d.total * 1000) / 10}%</span></header><progress aria-label={`${REPORT_DOMAINS[key as keyof typeof REPORT_DOMAINS]} correct`} max={d.total} value={d.correct} /></Domain>)}<Muted>All assigned questions included, including unanswered.</Muted></Card>
      <Card><h2>Recommended review order</h2>{s.limited ? <><h3>Limited evidence</h3><Muted>This attempt is less than 80% answered. Review the explanations before drawing conclusions about strengths or readiness.</Muted></> : <><ol><li>Review missed answers and their explanations.</li><li>{recommended ? `Practice ${recommended.label.toLowerCase()}: ${recommended.correct} of ${recommended.total} correct in this attempt.` : "Review any answers you were unsure about."}</li><li>Try a fresh simulation after reviewing.</li></ol>{recommended && <Action href={`/bank/${encodeURIComponent(bankSlug)}/practice?count=20&domain=${recommended.domain}`}>Practice {REPORT_DOMAINS[recommended.domain]}</Action>}</>}<Muted>Use this attempt to guide study—not predict exam readiness.</Muted></Card></Columns>
    <Card aria-labelledby="topics-title"><h2 id="topics-title">Topics to work on</h2>
      <Controls><label>Sort topics<select value={sort} onChange={e => setSort(e.target.value)}><option value="missed">Most missed or unanswered</option><option value="accuracy">Lowest accuracy</option></select></label></Controls>
      {topics.map(t => <TopicRow key={t.key}><div><strong>{t.label}</strong>{t.total < 5 && <Muted>Small sample ({t.total} questions)</Muted>}</div><span>{t.correct} / {t.total} correct</span><span>{t.unanswered} unanswered</span><Action href={`${reviewUrl}?topic=${encodeURIComponent(t.key)}${t.missed ? "&filter=missed" : ""}`}>{t.missed ? `Review ${t.missed}` : "Review topic"}</Action></TopicRow>)}
      {!topics.length && <Muted>No topic data is available.</Muted>}<Muted>Topics may overlap; counts do not add up to the exam total. Labels use this attempt’s historical questions.</Muted>
    </Card>
    <Card id="pacing"><h2>Pacing context</h2><Summary><div><dt>Recorded question time</dt><dd>{duration(report.pacing.totalTimeMs)}</dd></div><div><dt>Questions with timing</dt><dd>{report.pacing.recordedCount} / {report.rows.length}</dd></div><div><dt>Average recorded time</dt><dd>{duration(report.pacing.averageMs)}</dd></div><div><dt>Longest recorded time</dt><dd>{duration(report.pacing.longestMs)}</dd></div></Summary>
      <Muted>Unvisited questions are not treated as zero-second answers. Recorded question time is not elapsed exam time and may include time spent reviewing a question. Timing alone does not establish fatigue or readiness.</Muted>
      {report.pacing.recordedCount < report.rows.length && <Muted>Timing coverage is incomplete; averages describe only questions with recorded time.</Muted>}</Card>
    <Card id="questions"><h2>Question explorer</h2><Controls><label>Search questions or topics<input type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Question text, topic, or Q12" /></label><label>Topic<select value={topic} onChange={e => { setTopic(e.target.value); setPage(0); }}><option value="">All topics</option>{report.topics.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}</select></label></Controls>
      <Controls role="group" aria-label="Question status">{filters.map(([key,label,count]) => <Button key={key} aria-pressed={filter === key} onClick={() => { setFilter(key); setPage(0); }}>{label} ({count})</Button>)}</Controls>
      <Muted role="status">{rows.length} matching questions</Muted>
      {rows.slice(activePage * PAGE_SIZE, (activePage + 1) * PAGE_SIZE).map(row => <QuestionRow key={row.id}><header><strong>Q{row.index + 1} · {row.question ? REPORT_DOMAINS[row.question.domain] : "Unknown domain"}</strong><span>{row.status}{row.flagged ? " · Flagged" : ""}</span></header><p>{row.question?.prompt ?? "Historical question unavailable"}</p><Muted>{row.topics.map(t => t.label).join(" · ")} · Time: {duration(row.timeMs)}</Muted><Link href={`${reviewUrl}?q=${row.index}`}>See answer &amp; explanation →</Link></QuestionRow>)}
      {!rows.length && <p>No questions match these filters. <Button onClick={() => { setFilter("all"); setSearch(""); setTopic(""); setPage(0); }}>Clear filters</Button></p>}
      <Controls aria-label="Question pages"><Button disabled={activePage === 0} onClick={() => setPage(activePage - 1)}>Previous</Button><span>Page {activePage + 1} of {pageCount}</span><Button disabled={activePage + 1 >= pageCount} onClick={() => setPage(activePage + 1)}>Next</Button></Controls>
    </Card>
    <Footer><Link href="/dashboard">← Back to dashboard</Link><Link href={`/bank/${encodeURIComponent(bankSlug)}`}>Take another simulation</Link><Button onClick={async () => { try { await navigator.clipboard.writeText(`${setLabel}: ${s.percent}% — ${s.correct} correct, ${s.incorrect} incorrect, ${s.unanswered} unanswered. Practice result, not an official exam result.`); setCopyMessage("Summary copied."); } catch { setCopyMessage("Could not copy. Please try again."); } }}>Copy result summary</Button><span role="status">{copyMessage}</span></Footer>
  </Page>;
}
