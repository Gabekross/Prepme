"use client";

import styled from "styled-components";

export type AnswerState = "neutral" | "correct" | "incorrect" | "missed";

export const Stack = styled.div`
  display: grid;
  gap: 10px;
`;

export const Subtle = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  line-height: 1.5;
`;

export const Divider = styled.div`
  height: 1px;
  background: ${(p) => p.theme.divider};
  margin: 12px 0;
`;

export const Badge = styled.span<{ $state?: AnswerState }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 800;
  padding: 6px 12px;
  border-radius: 999px;

  /* default */
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};

  ${(p) =>
    p.$state === "correct"
      ? `
    border-color: ${p.theme.successBorder};
    background: ${p.theme.successSoft};
    color: ${p.theme.success};
  `
      : ""}

  ${(p) =>
    p.$state === "incorrect"
      ? `
    border-color: ${p.theme.errorBorder};
    background: ${p.theme.errorSoft};
    color: ${p.theme.error};
  `
      : ""}

  ${(p) =>
    p.$state === "missed"
      ? `
    border-style: dashed;
    border-color: ${p.theme.warningBorder};
    background: ${p.theme.warningSoft};
    color: ${p.theme.warning};
  `
      : ""}
`;

export const OptionButton = styled.button<{ $state?: AnswerState; $selected?: boolean }>`
  width: 100%;
  text-align: left;
  border-radius: 14px;
  border: 1.5px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  padding: 13px 14px;
  cursor: pointer;
  line-height: 1.45;
  transition: background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 100ms ease;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
    transform: translateX(2px);
  }

  &:active {
    transform: translateX(0);
  }

  ${(p) =>
    p.$selected
      ? `
    border-color: ${p.theme.accent};
    box-shadow: 0 0 0 3px ${p.theme.accentSoft};
    background: ${p.theme.accentSoft};
  `
      : ""}

  ${(p) =>
    p.$state === "correct"
      ? `
    border-color: ${p.theme.successBorder};
    box-shadow: 0 0 0 3px ${p.theme.successSoft};
    background: ${p.theme.successSoft};
  `
      : ""}

  ${(p) =>
    p.$state === "incorrect"
      ? `
    border-color: ${p.theme.errorBorder};
    box-shadow: 0 0 0 3px ${p.theme.errorSoft};
    background: ${p.theme.errorSoft};
  `
      : ""}

  ${(p) =>
    p.$state === "missed"
      ? `
    border-style: dashed;
    border-color: ${p.theme.warningBorder};
    box-shadow: 0 0 0 3px ${p.theme.warningSoft};
    background: ${p.theme.warningSoft};
  `
      : ""}
`;

export const Button = styled.button`
  appearance: none;
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background 140ms ease, transform 100ms ease;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

export const LinkButton = styled.button`
  border: none;
  background: transparent;
  color: ${(p) => p.theme.accent};
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: ${(p) => p.theme.accentHover};
  }
`;
