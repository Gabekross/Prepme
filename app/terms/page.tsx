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

export default function TermsPage() {
  return (
    <PageWrap>
      <PageTitle>Terms of Service</PageTitle>
      <MetaLine>Effective Date: April 22, 2026 &middot; Jemigah LLC</MetaLine>

      <Block>
        <BlockTitle>1. Acceptance of Terms</BlockTitle>
        <P>
          By accessing or using PMP Mastery Lab (&ldquo;the Service&rdquo;) at www.pmpmasterylab.com,
          you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>2. Description of Service</BlockTitle>
        <P>
          PMP Mastery Lab is a digital PMP exam preparation platform providing practice questions,
          timed simulations, adaptive difficulty training, and performance analytics. The Service
          is operated by Jemigah LLC.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>3. Eligibility</BlockTitle>
        <P>
          You must be at least 18 years old to use this Service. By registering, you confirm
          that you meet this requirement and that all information you provide is accurate.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>4. User Accounts</BlockTitle>
        <P>
          You are responsible for maintaining the confidentiality of your account credentials.
          You agree to provide accurate information and to notify us immediately at{" "}
          <InlineLink href="mailto:support@pmpmasterylab.com">support@pmpmasterylab.com</InlineLink>{" "}
          of any unauthorized use of your account. You are responsible for all activity that
          occurs under your account.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>5. Payment &amp; Access</BlockTitle>
        <Ul>
          <Li>
            <strong>Starter Plan (Free):</strong> Access is provided at no charge and may be
            modified or withdrawn at any time with reasonable notice.
          </Li>
          <Li>
            <strong>Study Mode ($29 one-time):</strong> A single, non-recurring payment grants
            lifetime access to Study Mode features as described at the time of purchase.
            &ldquo;Lifetime&rdquo; means for as long as the Service remains operational.
          </Li>
        </Ul>
        <P>
          All payments are processed securely by Stripe. We do not store your payment card information.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>6. Refunds</BlockTitle>
        <P>
          Refund requests are governed by our{" "}
          <InlineLink href="/refund">Refund Policy</InlineLink>. Because this is a digital
          product with immediate access upon purchase, refunds are subject to the conditions
          described there.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>7. Intellectual Property</BlockTitle>
        <P>
          All content on PMP Mastery Lab — including questions, explanations, analytics features,
          and software — is owned by Jemigah LLC or its licensors. You may not copy, reproduce,
          distribute, reverse engineer, or create derivative works from any part of the Service
          without express written permission.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>8. Acceptable Use</BlockTitle>
        <P>You agree not to:</P>
        <Ul>
          <Li>Share, resell, or redistribute question content or account access</Li>
          <Li>Use automated tools to scrape or bulk-download questions or data</Li>
          <Li>Attempt to reverse engineer or tamper with the platform</Li>
          <Li>Use the Service for any unlawful purpose or in violation of any applicable law</Li>
          <Li>Post, transmit, or distribute harmful, offensive, or misleading content</Li>
        </Ul>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>9. Disclaimer of Warranties</BlockTitle>
        <P>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
          WE DO NOT GUARANTEE THAT USE OF THE SERVICE WILL RESULT IN PASSING THE PMP EXAM. EXAM
          OUTCOMES DEPEND ON INDIVIDUAL PREPARATION, EXPERIENCE, AND PERFORMANCE ON EXAM DAY.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>10. Limitation of Liability</BlockTitle>
        <P>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, JEMIGAH LLC SHALL NOT BE LIABLE FOR
          ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF
          OR INABILITY TO USE THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU
          PAID TO JEMIGAH LLC IN THE 12 MONTHS PRECEDING THE CLAIM.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>11. Termination</BlockTitle>
        <P>
          We reserve the right to suspend or terminate your account for violation of these Terms,
          with or without notice, at our sole discretion. You may delete your account at any time
          by contacting{" "}
          <InlineLink href="mailto:support@pmpmasterylab.com">support@pmpmasterylab.com</InlineLink>.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>12. Governing Law</BlockTitle>
        <P>
          These Terms are governed by the laws of the State of Maryland, without regard to its
          conflict of law principles. Any disputes shall be resolved in the courts of Maryland.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>13. Changes to Terms</BlockTitle>
        <P>
          We may update these Terms at any time. Continued use of the Service after changes
          constitutes your acceptance of the revised Terms. We will notify you of material
          changes by email or in-app notice at least 7 days before they take effect.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>14. Contact</BlockTitle>
        <P>
          Questions about these Terms? Email{" "}
          <InlineLink href="mailto:support@pmpmasterylab.com">support@pmpmasterylab.com</InlineLink>{" "}
          or visit our <InlineLink href="/contact">Contact page</InlineLink>.
        </P>
      </Block>
    </PageWrap>
  );
}
