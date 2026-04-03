"use client";
import React from "react";
import styled from "styled-components";
import type { Scenario } from "../core/types";

const Box = styled.div`
  border-radius: 14px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.cardBg2};
  padding: 14px 16px;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: ${(p) => p.theme.accent};
    border-radius: 3px 0 0 3px;
  }
`;

const KickerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
`;

const Kicker = styled.div`
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: ${(p) => p.theme.accent};
`;

const Title = styled.div`
  font-weight: 800;
  font-size: 13.5px;
  color: ${(p) => p.theme.text};
  word-break: break-word;
  overflow-wrap: break-word;
`;

const Text = styled.p`
  margin: 8px 0 0;
  font-size: 13.5px;
  line-height: 1.6;
  color: ${(p) => p.theme.mutedStrong};
  word-break: break-word;
  overflow-wrap: break-word;
`;

export function ScenarioBlock({ scenario }: { scenario: Scenario }) {
  return (
    <Box>
      <KickerRow>
        <Kicker>📋 Scenario</Kicker>
      </KickerRow>
      <Title>{scenario.title ?? "Context"}</Title>
      <Text>{scenario.text}</Text>
    </Box>
  );
}
