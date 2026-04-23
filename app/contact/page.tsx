"use client";

import React from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const PageWrap = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 0 80px;
  animation: ${fadeUp} 400ms ease both;
`;

const PageTitle = styled.h1`
  margin: 0 0 8px;
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 900;
  letter-spacing: -0.6px;
  color: ${(p) => p.theme.text};
`;

const PageSub = styled.p`
  margin: 0 0 40px;
  font-size: 15px;
  color: ${(p) => p.theme.muted};
  line-height: 1.6;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 40px;

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

const ContactCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 20px;
  padding: 24px 20px;
  box-shadow: ${(p) => p.theme.shadow};
`;

const CardLabel = styled.div`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: ${(p) => p.theme.accent};
  margin-bottom: 10px;
`;

const CardTitle = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  margin-bottom: 6px;
  letter-spacing: -0.2px;
`;

const CardBody = styled.p`
  margin: 0 0 16px;
  font-size: 13.5px;
  line-height: 1.6;
  color: ${(p) => p.theme.muted};
`;

const CardMeta = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.muted};
  margin-bottom: 16px;
`;

const EmailBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 10px;
  background: ${(p) => p.theme.accent};
  color: white;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  transition: opacity 150ms ease, transform 100ms ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${(p) => p.theme.divider};
  margin: 32px 0;
`;

const LegalRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const LegalLabel = styled.span`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
`;

const InlineLink = styled(Link)`
  font-size: 13px;
  color: ${(p) => p.theme.accent};
  font-weight: 600;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const Sep = styled.span`
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  opacity: 0.4;
`;

const Note = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${(p) => p.theme.muted};
  line-height: 1.6;
`;

export default function ContactPage() {
  return (
    <PageWrap>
      <PageTitle>Contact Us</PageTitle>
      <PageSub>
        We&rsquo;re a small team and we read every message. Whether it&rsquo;s a
        question, a bug report, or feedback — we want to hear from you.
      </PageSub>

      <CardGrid>
        <ContactCard>
          <CardLabel>Support</CardLabel>
          <CardTitle>Account &amp; Billing</CardTitle>
          <CardBody>
            Questions about your account, Study Mode access, or a payment issue?
            We&rsquo;ll get back to you fast.
          </CardBody>
          <CardMeta>Response time: 1–2 business days</CardMeta>
          <EmailBtn href="mailto:support@pmpmasterylab.com">
            Email Support →
          </EmailBtn>
        </ContactCard>

        <ContactCard>
          <CardLabel>Feedback</CardLabel>
          <CardTitle>Questions &amp; Features</CardTitle>
          <CardBody>
            Spotted a question error? Have a feature suggestion? Send us a note
            with the subject &ldquo;Feedback&rdquo; and we&rsquo;ll respond.
          </CardBody>
          <CardMeta>Response time: 2–3 business days</CardMeta>
          <EmailBtn href="mailto:support@pmpmasterylab.com?subject=Feedback">
            Send Feedback →
          </EmailBtn>
        </ContactCard>
      </CardGrid>

      <Divider />

      <Note>
        <strong>Legal &amp; Privacy requests</strong> (GDPR data access, deletion, or
        legal correspondence) — email{" "}
        <InlineLink href="mailto:support@pmpmasterylab.com">
          support@pmpmasterylab.com
        </InlineLink>{" "}
        with the subject &ldquo;Privacy Request&rdquo;.
      </Note>

      <Divider />

      <LegalRow>
        <LegalLabel>Legal:</LegalLabel>
        <InlineLink href="/terms">Terms of Service</InlineLink>
        <Sep>&middot;</Sep>
        <InlineLink href="/privacy">Privacy Policy</InlineLink>
        <Sep>&middot;</Sep>
        <InlineLink href="/refund">Refund Policy</InlineLink>
      </LegalRow>
    </PageWrap>
  );
}
