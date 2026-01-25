"use client";

import styled from "styled-components";

export type AnswerState = "neutral" | "correct" | "incorrect" | "missed";

export const Stack = styled.div`
  display: grid;
  gap: 10px;
`;

export const Subtle = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  line-height: 1.4;
`;

export const Divider = styled.div`
  height: 1px;
  background: ${(p) => p.theme.cardBorder};
  margin: 10px 0;
`;

export const Badge = styled.span<{ $state?: AnswerState }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};

  ${(p) =>
    p.$state === "correct"
      ? `
    border-color: rgba(34,197,94,0.55);
    background: rgba(34,197,94,0.14);
  `
      : ""}

  ${(p) =>
    p.$state === "incorrect"
      ? `
    border-color: rgba(239,68,68,0.55);
    background: rgba(239,68,68,0.14);
  `
      : ""}

  ${(p) =>
    p.$state === "missed"
      ? `
    border-style: dashed;
    border-color: rgba(245,158,11,0.55);
    background: rgba(245,158,11,0.12);
  `
      : ""}
`;

export const OptionButton = styled.button<{ $state?: AnswerState; $selected?: boolean }>`
  width: 100%;
  text-align: left;
  border-radius: 14px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  padding: 12px 12px;
  cursor: pointer;
  line-height: 1.35;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }

  &:active {
    transform: translateY(1px);
  }

  /* ✅ Strong, always-visible selection highlight */
  ${(p) =>
    p.$selected
      ? `
    border-color: ${p.theme.accent};
    box-shadow: 0 0 0 3px ${p.theme.accentSoft};
  `
      : ""}

  /* ✅ Correctness states override selection after reveal */
  ${(p) =>
    p.$state === "correct"
      ? `
    border-color: rgba(34,197,94,0.85);
    box-shadow: 0 0 0 3px rgba(34,197,94,0.18);
    background: ${p.theme.name === "dark" ? "rgba(34,197,94,0.18)" : "rgba(34,197,94,0.12)"};
  `
      : ""}

  ${(p) =>
    p.$state === "incorrect"
      ? `
    border-color: rgba(239,68,68,0.85);
    box-shadow: 0 0 0 3px rgba(239,68,68,0.18);
    background: ${p.theme.name === "dark" ? "rgba(239,68,68,0.18)" : "rgba(239,68,68,0.12)"};
  `
      : ""}

  ${(p) =>
    p.$state === "missed"
      ? `
    border-style: dashed;
    border-color: rgba(245,158,11,0.85);
    box-shadow: 0 0 0 3px rgba(245,158,11,0.16);
    background: ${p.theme.name === "dark" ? "rgba(245,158,11,0.14)" : "rgba(245,158,11,0.10)"};
  `
      : ""}
`;

export const Button = styled.button`
  appearance: none;
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const LinkButton = styled.button`
  border: none;
  background: transparent;
  color: ${(p) => p.theme.muted};
  cursor: pointer;
  text-decoration: underline;
  padding: 0;

  &:hover {
    color: ${(p) => p.theme.text};
  }
`;
