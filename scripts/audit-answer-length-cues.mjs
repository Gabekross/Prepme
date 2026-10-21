#!/usr/bin/env node
import { readFileSync } from "node:fs";

const path = process.argv.find((arg, index) => index > 1 && !arg.startsWith("--")) ?? "staging/set-a-replacements.json";
const questions = JSON.parse(readFileSync(path, "utf8"));
const findings = [];

const length = (choice) => String(choice?.text ?? "").trim().length;
const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

for (const question of questions) {
  if (!["mcq_single", "mcq_multi", "pull_down"].includes(question.type)) continue;
  const choices = question.payload?.choices ?? [];
  if (choices.length < 2) continue;

  const correctIds = question.type === "mcq_multi"
    ? question.answerKey.correctChoiceIds
    : [question.answerKey.correctChoiceId];
  const correct = choices.filter((item) => correctIds.includes(item.id)).map(length);
  const incorrect = choices.filter((item) => !correctIds.includes(item.id)).map(length);
  if (!correct.length || !incorrect.length) continue;

  const correctAverage = average(correct);
  const incorrectAverage = average(incorrect);
  const ratio = correctAverage / Math.max(incorrectAverage, 1);
  const gap = correctAverage - incorrectAverage;
  const uniquelyLongest = Math.min(...correct) > Math.max(...incorrect);

  let severity = null;
  if (ratio >= 1.75 && gap >= 60) severity = "critical";
  else if (ratio >= 1.5 && gap >= 40) severity = "high";
  else if ((ratio >= 1.3 && gap >= 20) || (uniquelyLongest && gap >= 28)) severity = "moderate";

  if (severity) {
    findings.push({
      id: question.id,
      type: question.type,
      severity,
      correctIds,
      correctLengths: correct,
      incorrectLengths: incorrect,
      correctAverage: Math.round(correctAverage * 10) / 10,
      incorrectAverage: Math.round(incorrectAverage * 10) / 10,
      ratio: Math.round(ratio * 100) / 100,
      gap: Math.round(gap * 10) / 10,
      uniquelyLongest,
    });
  }
}

findings.sort((a, b) => b.ratio - a.ratio || b.gap - a.gap);
const counts = Object.fromEntries(["critical", "high", "moderate"].map((severity) => [severity, findings.filter((item) => item.severity === severity).length]));
const report = { path, total: questions.length, flagged: findings.length, counts, ...(process.argv.includes("--summary") ? {} : { findings }) };
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes("--fail") && (counts.critical || counts.high)) process.exitCode = 1;
