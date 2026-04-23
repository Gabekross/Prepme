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

const ExternalLink = styled.a`
  color: ${(p) => p.theme.accent};
  font-weight: 600;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

export default function PrivacyPage() {
  return (
    <PageWrap>
      <PageTitle>Privacy Policy</PageTitle>
      <MetaLine>Effective Date: April 22, 2026 &middot; Jemigah LLC</MetaLine>

      <Block>
        <BlockTitle>1. Who We Are</BlockTitle>
        <P>
          Jemigah LLC operates PMP Mastery Lab at www.pmpmasterylab.com. This Privacy Policy
          explains what personal data we collect, how we use it, and your rights regarding that data.
          By using the Service, you consent to the practices described here.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>2. Information We Collect</BlockTitle>
        <Ul>
          <Li>
            <strong>Account data:</strong> Your email address and a hashed password, stored
            securely via Supabase Auth.
          </Li>
          <Li>
            <strong>Usage &amp; exam data:</strong> Exam attempts, question responses, scores,
            domain breakdowns, session timestamps, and practice history. This data powers your
            analytics and personalized study recommendations.
          </Li>
          <Li>
            <strong>Payment data:</strong> Billing is handled entirely by Stripe. We never
            receive, store, or process your credit card number, CVV, or banking information.
          </Li>
          <Li>
            <strong>Technical data:</strong> IP address, browser type, and session cookies
            used solely for authentication and security.
          </Li>
        </Ul>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>3. How We Use Your Information</BlockTitle>
        <Ul>
          <Li>To create and manage your account</Li>
          <Li>To deliver your exam results, analytics, and personalized recommendations</Li>
          <Li>To send transactional emails (account confirmation, password reset)</Li>
          <Li>To process payments securely via Stripe</Li>
          <Li>To analyze aggregate, anonymized usage patterns to improve question quality and platform features</Li>
          <Li>To comply with legal obligations</Li>
        </Ul>
        <P>We do not use your data for advertising or sell it to any third party.</P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>4. Data Storage &amp; Security</BlockTitle>
        <P>
          Your account and exam data is stored in Supabase (PostgreSQL), hosted on secure,
          SOC 2-compliant cloud infrastructure. All data is transmitted over HTTPS. Passwords
          are hashed using industry-standard algorithms and are never stored in plain text.
        </P>
        <P>
          While we take reasonable measures to protect your data, no system is completely
          secure. We encourage you to use a strong, unique password for your account.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>5. Third-Party Services</BlockTitle>
        <P>We use the following trusted third-party services:</P>
        <Ul>
          <Li>
            <strong>Supabase</strong> — database and authentication.{" "}
            <ExternalLink href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
              supabase.com/privacy
            </ExternalLink>
          </Li>
          <Li>
            <strong>Stripe</strong> — payment processing.{" "}
            <ExternalLink href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
              stripe.com/privacy
            </ExternalLink>
          </Li>
        </Ul>
        <P>We do not share your personal data with any other third parties.</P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>6. Cookies</BlockTitle>
        <P>
          We use essential session cookies required for authentication. We do not use advertising
          cookies, tracking pixels, or third-party analytics cookies. You may disable cookies in
          your browser settings, but this will prevent you from staying signed in.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>7. Your Rights</BlockTitle>
        <P>
          Depending on your location, you may have rights under GDPR, CCPA, or other applicable
          privacy laws, including:
        </P>
        <Ul>
          <Li><strong>Access:</strong> Request a copy of the personal data we hold about you</Li>
          <Li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</Li>
          <Li><strong>Deletion:</strong> Request deletion of your account and associated data</Li>
          <Li><strong>Portability:</strong> Request your data in a portable format</Li>
          <Li><strong>Objection:</strong> Object to or restrict certain processing activities</Li>
        </Ul>
        <P>
          To exercise any of these rights, email{" "}
          <InlineLink href="mailto:support@pmpmasterylab.com">support@pmpmasterylab.com</InlineLink>.
          We will respond within 30 days.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>8. Data Retention</BlockTitle>
        <P>
          We retain your account and exam data for as long as your account is active. If you
          request account deletion, we will remove your personal data within 30 days, except
          where retention is required by law.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>9. Children&rsquo;s Privacy</BlockTitle>
        <P>
          PMP Mastery Lab is not directed at individuals under 18 years of age. We do not
          knowingly collect personal data from minors. If you believe a minor has provided us
          with personal data, please contact us and we will delete it promptly.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>10. Changes to This Policy</BlockTitle>
        <P>
          We may update this Privacy Policy periodically. The effective date at the top of
          this page will reflect the most recent revision. For material changes, we will
          notify you by email or in-app notice before they take effect.
        </P>
      </Block>

      <Divider />

      <Block>
        <BlockTitle>11. Contact</BlockTitle>
        <P>
          Privacy questions or data requests:{" "}
          <InlineLink href="mailto:support@pmpmasterylab.com">support@pmpmasterylab.com</InlineLink>
        </P>
        <P>
          Jemigah LLC &middot; Maryland, United States
        </P>
      </Block>
    </PageWrap>
  );
}
