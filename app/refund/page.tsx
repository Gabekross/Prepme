"use client";

import React from "react";
import styled from "styled-components";
import Link from "next/link";

const PageWrap = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 0 80px;
`;

const PageTitle = styled.h1`
  margin: 0 0 6px;
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 900;
  letter-spacing: -0.6px;
  color: ${(p) => p.theme.text};
`;

const MetaLine = styled.p`
  margin: 0 0 40px;
  font-size: 13px;
  color: ${(p) => p.theme.muted};
`;

const HighlightCard = styled.div`
  background: ${(p) => p.theme.accentSoft};
  border: 1px solid ${(p) => p.theme.accent}33;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 32px;
`;

const HighlightText = styled.p`
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: ${(p) => p.theme.accent};
  line-height: 1.5;
`;

const Block = styled.section`
  margin-bottom: 32px;
`;

const BlockTitle = styled.h2`
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 800;
  color: ${(p) => p.theme.text};
  letter-spacing: -0.2px;
`;

const P = styled.p`
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.7;
  color: ${(p) => p.theme.mutedStrong ?? p.theme.muted};
`;

const Ul = styled.ul`
  margin: 0 0 10px;
  padding-left: 20px;
`;

const Li = styled.li`
  font-size: 14px;
  line-height: 1.7;
  color: ${(p) => p.theme.mutedStrong ?? p.theme.muted};
  margin-bottom: 4px;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${(p) => p.theme.divider};
  margin: 32px 0;
`;

const InlineLink = styled(Link)`
  color: ${(p) => p.theme.accent};
  font-weight: 600;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const ContactBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  background: ${(p) => p.theme.accent};
  color: white;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
  transition: opacity 150ms ease, transform 100ms ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

export default function RefundPage() {
  return (
    <PageWrap>
      <PageTitle>Refund Policy</PageTitle>
      <MetaLine>Effective Date: April 22, 2026 &middot; Jemigah LLC</MetaLine>

      <HighlightCard>
        <HighlightText>
          We offer a 7-day full refund on Study Mode — no questions asked, as long as you
          haven&rsquo;t completed more than one full simulation.
        </HighlightText>
      </HighlightCard>

      <Block>
        <BlockTitle>Our Commitment</BlockTitle>
        <P>
          We want you to feel confident purchasing Study Mode. PMP prep is a real investment
          of time and money, and we stand behind the quality of our platform. If it&rsquo;s
          not right for you, we make it easy to get your money back.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>Digital Product Policy</BlockTitle>
        <P>
          Study Mode ($29) is a digital product that provides immediate access to premium
          features upon payment — including Sets B &amp; C, topic-level analytics, and the
          adaptive difficulty engine. Because access is granted instantly, we apply the
          following refund conditions.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>Refund Eligibility</BlockTitle>
        <P>You are eligible for a <strong>full refund</strong> if:</P>
        <Ul>
          <Li>You request it within <strong>7 days</strong> of your purchase date</Li>
          <Li>You have not completed more than one full exam simulation (Set B or Set C)</Li>
        </Ul>
        <P>
          We reserve the right to decline refund requests where the content has been substantially
          consumed or where the request appears to be made in bad faith.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>How to Request a Refund</BlockTitle>
        <P>Email us at{" "}
          <InlineLink href="mailto:support@pmpmasterylab.com">support@pmpmasterylab.com</InlineLink>{" "}
          with:
        </P>
        <Ul>
          <Li>The email address associated with your account</Li>
          <Li>Your purchase date or Stripe receipt reference</Li>
          <Li>A brief reason (optional — helps us improve, but not required)</Li>
        </Ul>
        <P>
          We process approved refunds within <strong>5 business days</strong>. Funds are
          returned to your original payment method. Depending on your bank, it may take an
          additional 5–10 business days to appear in your account.
        </P>
        <ContactBtn href="mailto:support@pmpmasterylab.com">
          Request a Refund
        </ContactBtn>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>Exceptions</BlockTitle>
        <P>Refunds will not be issued for:</P>
        <Ul>
          <Li>Requests made more than 7 days after the purchase date</Li>
          <Li>Accounts found to have violated our{" "}
            <InlineLink href="/terms">Terms of Service</InlineLink>
          </Li>
          <Li>The free Starter Plan (no charge applies)</Li>
        </Ul>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>Questions?</BlockTitle>
        <P>
          Contact us at{" "}
          <InlineLink href="mailto:support@pmpmasterylab.com">support@pmpmasterylab.com</InlineLink>{" "}
          or visit our <InlineLink href="/contact">Contact page</InlineLink>. We typically
          respond within 1–2 business days.
        </P>
      </Block>
    </PageWrap>
  );
}
