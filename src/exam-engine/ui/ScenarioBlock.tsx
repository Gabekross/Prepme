"use client";
import React from "react";
import styled from "styled-components";
import type { Scenario } from "../core/types";

const Box = styled.div`
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.03);
  padding: 12px 12px;
`;

const Title = styled.div`
  font-weight: 900;
  font-size: 13px;
  opacity: 0.95;
`;

const Text = styled.p`
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.55;
  opacity: 0.85;
`;

export function ScenarioBlock({ scenario }: { scenario: Scenario }) {
  return (
    <Box>
      <Title>{scenario.title ?? "Scenario"}</Title>
      <Text>{scenario.text}</Text>
    </Box>
  );
}
