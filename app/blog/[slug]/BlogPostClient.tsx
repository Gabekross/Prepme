"use client";

import Link from "next/link";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import type { BlogPost } from "@/src/marketing/types";
import { estimateReadingTime, extractHeadings, MarkdownView } from "@/src/marketing/markdown";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const BlogGlobals = createGlobalStyle`
  html {
    scroll-behavior: smooth;
  }
`;

const Page = styled.article`
  animation: ${fadeUp} 260ms ease both;
  overflow-x: clip;
`;

const Hero = styled.header`
  border-bottom: 1px solid ${(p) => p.theme.cardBorder};
  background:
    radial-gradient(circle at 12% 18%, rgba(14, 165, 233, 0.14), transparent 28%),
    linear-gradient(135deg, ${(p) => p.theme.cardBg2} 0%, ${(p) => p.theme.cardBg} 100%);
`;

const HeroInner = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px 20px 38px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 430px);
  gap: 34px;
  align-items: center;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    padding-top: 26px;
  }
`;

const Back = styled(Link)`
  color: ${(p) => p.theme.muted};
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  &:hover { color: ${(p) => p.theme.accent}; }
`;

const HeroCopy = styled.div`
  min-width: 0;
`;

const Meta = styled.div`
  color: ${(p) => p.theme.accent};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 22px 0 12px;
`;

const Title = styled.h1`
  color: ${(p) => p.theme.text};
  font-size: clamp(34px, 6vw, 64px);
  line-height: 1.02;
  letter-spacing: 0;
  margin: 0 0 16px;
  max-width: 860px;
`;

const Excerpt = styled.p`
  color: ${(p) => p.theme.mutedStrong};
  font-size: 18px;
  line-height: 1.7;
  margin: 0;
  max-width: 760px;
`;

const HeroMedia = styled.div`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  aspect-ratio: 16 / 10;
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 8px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.24), rgba(14, 165, 233, 0.1)),
    repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 12px),
    ${(p) => p.theme.cardBg};
  box-shadow: ${(p) => p.theme.shadow};
  min-height: 230px;

  @media (max-width: 520px) {
    min-height: 0;
  }
`;

const HeroImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const FallbackMedia = styled.div`
  height: 100%;
  padding: 26px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  color: ${(p) => p.theme.text};
`;

const FallbackKicker = styled.div`
  color: ${(p) => p.theme.accent};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
`;

const FallbackTitle = styled.div`
  font-size: 24px;
  line-height: 1.15;
  font-weight: 900;
`;

const BodyWrap = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  padding: 34px 20px 86px;
  display: grid;
  grid-template-columns: 240px minmax(0, 800px);
  gap: 42px;
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    gap: 22px;
    padding-top: 24px;
  }
`;

const Sidebar = styled.aside`
  position: sticky;
  top: 86px;

  @media (max-width: 980px) {
    display: none;
  }
`;

const MobileToc = styled.details`
  display: none;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 8px;
  padding: 14px 16px;

  summary {
    cursor: pointer;
    color: ${(p) => p.theme.text};
    font-weight: 900;
  }

  @media (max-width: 980px) {
    display: block;
  }
`;

const TocCard = styled.nav`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 8px;
  padding: 16px;
`;

const TocTitle = styled.div`
  color: ${(p) => p.theme.text};
  font-size: 13px;
  font-weight: 900;
  margin-bottom: 10px;
`;

const TocLink = styled.a<{ $level?: number }>`
  display: block;
  color: ${(p) => p.theme.mutedStrong};
  font-size: 13px;
  line-height: 1.45;
  text-decoration: none;
  padding: 7px 0 7px ${(p) => (p.$level === 3 ? "12px" : "0")};
  border-top: 1px solid ${(p) => p.theme.cardBorder};

  &:hover {
    color: ${(p) => p.theme.accent};
  }
`;

const ArticleColumn = styled.div<{ $wide?: boolean }>`
  min-width: 0;
  grid-column: ${(p) => (p.$wide ? "1 / -1" : "auto")};
  width: 100%;
  max-width: ${(p) => (p.$wide ? "820px" : "none")};
  margin: ${(p) => (p.$wide ? "0 auto" : "0")};
`;

const Content = styled.div`
  color: ${(p) => p.theme.text};
  font-size: 17px;
  line-height: 1.82;
  overflow-wrap: anywhere;

  h1, h2, h3 {
    color: ${(p) => p.theme.text};
    letter-spacing: 0;
    line-height: 1.2;
    scroll-margin-top: 98px;
  }

  h1 { font-size: 31px; margin: 38px 0 14px; }
  h2 { font-size: 28px; margin: 42px 0 14px; }
  h3 { font-size: 22px; margin: 30px 0 10px; }

  p { margin: 0 0 20px; }
  ul, ol { margin: 0 0 22px; padding-left: 24px; }
  li { margin-bottom: 9px; }

  a {
    color: ${(p) => p.theme.accent};
    font-weight: 800;
  }

  strong {
    font-weight: 900;
  }

  em {
    font-style: italic;
  }

  code {
    color: ${(p) => p.theme.text};
    background: ${(p) => p.theme.cardBg2};
    border: 1px solid ${(p) => p.theme.cardBorder};
    border-radius: 6px;
    padding: 2px 5px;
    font-size: 0.92em;
  }

  .blog-table-wrap {
    width: 100%;
    overflow-x: auto;
    margin: 28px 0 30px;
    border: 1px solid ${(p) => p.theme.cardBorder};
    border-radius: 8px;
    background: ${(p) => p.theme.cardBg};
  }

  .blog-table {
    width: 100%;
    min-width: 560px;
    border-collapse: collapse;
    font-size: 15px;
    line-height: 1.55;
  }

  .blog-table th,
  .blog-table td {
    padding: 13px 15px;
    border-bottom: 1px solid ${(p) => p.theme.cardBorder};
    text-align: left;
    vertical-align: top;
  }

  .blog-table th {
    background: ${(p) => p.theme.cardBg2};
    color: ${(p) => p.theme.text};
    font-weight: 900;
  }

  .blog-table tr:last-child td {
    border-bottom: 0;
  }

  .blog-table tbody tr:nth-child(even) {
    background: ${(p) => p.theme.inputBg};
  }

  .pmp-tip,
  .blog-practice,
  .blog-mid-cta {
    border-radius: 8px;
    margin: 30px 0;
  }

  .pmp-tip {
    border: 1px solid rgba(20, 184, 166, 0.34);
    background: linear-gradient(135deg, rgba(20, 184, 166, 0.13), rgba(14, 165, 233, 0.07));
    padding: 18px 20px;
  }

  .pmp-tip-label,
  .blog-practice-label {
    color: ${(p) => p.theme.accent};
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .blog-practice {
    border: 1px solid ${(p) => p.theme.cardBorder};
    background: ${(p) => p.theme.cardBg};
    padding: 20px;
  }

  .blog-practice-question {
    font-weight: 850;
  }

  .blog-practice-choices {
    display: grid;
    gap: 10px;
    margin: 14px 0 16px;
  }

  .blog-choice {
    width: 100%;
    display: grid;
    grid-template-columns: 34px 1fr;
    gap: 10px;
    align-items: start;
    text-align: left;
    border: 1px solid ${(p) => p.theme.cardBorder};
    border-radius: 8px;
    background: ${(p) => p.theme.inputBg};
    color: ${(p) => p.theme.text};
    padding: 11px 12px;
    cursor: pointer;
    font: inherit;
    line-height: 1.5;
  }

  .blog-choice span:first-child {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: ${(p) => p.theme.cardBg};
    border: 1px solid ${(p) => p.theme.cardBorder};
    color: ${(p) => p.theme.mutedStrong};
    font-size: 13px;
    font-weight: 900;
  }

  .blog-choice:hover,
  .blog-choice.is-selected {
    border-color: ${(p) => p.theme.accent};
    background: ${(p) => p.theme.accentSoft};
  }

  .blog-choice.is-answer {
    border-color: ${(p) => p.theme.successBorder};
    background: ${(p) => p.theme.successSoft};
  }

  .blog-choice.is-answer span:first-child {
    color: ${(p) => p.theme.success};
    border-color: ${(p) => p.theme.successBorder};
  }

  .blog-choice.is-wrong {
    border-color: ${(p) => p.theme.errorBorder};
    background: ${(p) => p.theme.errorSoft};
  }

  .blog-choice.is-wrong span:first-child {
    color: ${(p) => p.theme.error};
    border-color: ${(p) => p.theme.errorBorder};
  }

  .blog-practice-check {
    border: 0;
    border-radius: 8px;
    background: ${(p) => p.theme.accent};
    color: #fff;
    font-weight: 900;
    padding: 10px 14px;
    cursor: pointer;
  }

  .blog-practice-check:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .blog-practice-answer {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid ${(p) => p.theme.cardBorder};
  }

  .blog-practice-answer.is-correct strong {
    color: ${(p) => p.theme.success};
  }

  .blog-practice-answer.is-incorrect strong {
    color: ${(p) => p.theme.error};
  }

  .blog-mid-cta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    border: 1px solid ${(p) => p.theme.cardBorder};
    background: ${(p) => p.theme.cardBg};
    padding: 20px;
  }

  .blog-mid-cta-title {
    color: ${(p) => p.theme.text};
    font-size: 20px;
    font-weight: 900;
    line-height: 1.25;
  }

  .blog-mid-cta p {
    margin: 6px 0 0;
    color: ${(p) => p.theme.mutedStrong};
    font-size: 14px;
    line-height: 1.5;
  }

  .blog-mid-cta a {
    flex: 0 0 auto;
    border-radius: 8px;
    background: ${(p) => p.theme.accent};
    color: #fff;
    padding: 11px 14px;
    text-decoration: none;
    text-align: center;
  }

  @media (max-width: 640px) {
    font-size: 16px;

    h2 { font-size: 24px; }
    h3 { font-size: 20px; }

    .blog-table-wrap {
      margin-left: -2px;
      margin-right: -2px;
    }

    .blog-table {
      min-width: 520px;
      font-size: 14px;
    }

    .blog-table th,
    .blog-table td {
      padding: 11px 12px;
    }

    .blog-mid-cta {
      display: grid;
    }
  }
`;

const AuthorBox = styled.section`
  margin-top: 38px;
  border-top: 1px solid ${(p) => p.theme.cardBorder};
  border-bottom: 1px solid ${(p) => p.theme.cardBorder};
  padding: 22px 0;
`;

const AuthorTitle = styled.div`
  color: ${(p) => p.theme.text};
  font-weight: 900;
  margin-bottom: 6px;
`;

const SupportingText = styled.p`
  color: ${(p) => p.theme.mutedStrong};
  font-size: 14px;
  line-height: 1.65;
  margin: 0;
`;

const EndCta = styled.section`
  margin-top: 36px;
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 8px;
  background: ${(p) => p.theme.cardBg};
  padding: 24px;
`;

const EndCtaTitle = styled.h2`
  color: ${(p) => p.theme.text};
  font-size: 28px;
  line-height: 1.2;
  letter-spacing: 0;
  margin: 0 0 12px;
`;

const BenefitGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 18px;
  padding: 0;
  margin: 18px 0 22px;
  list-style: none;

  li {
    color: ${(p) => p.theme.mutedStrong};
    font-weight: 750;
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  @media (max-width: 520px) {
    display: grid;
  }
`;

const CtaButton = styled(Link)<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border-radius: 8px;
  padding: 10px 16px;
  text-decoration: none;
  font-weight: 900;
  color: ${(p) => (p.$primary ? "#fff" : p.theme.text)};
  background: ${(p) => (p.$primary ? p.theme.accent : "transparent")};
  border: 1px solid ${(p) => (p.$primary ? p.theme.accent : p.theme.cardBorder)};
`;

const Related = styled.section`
  margin-top: 42px;
`;

const RelatedTitle = styled.h2`
  color: ${(p) => p.theme.text};
  font-size: 24px;
  letter-spacing: 0;
  margin: 0 0 16px;
`;

const RelatedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const RelatedCard = styled(Link)`
  display: grid;
  gap: 8px;
  color: inherit;
  text-decoration: none;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 8px;
  padding: 16px;

  &:hover {
    border-color: ${(p) => p.theme.accent};
  }
`;

const RelatedMeta = styled.div`
  color: ${(p) => p.theme.accent};
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

const RelatedCardTitle = styled.h3`
  color: ${(p) => p.theme.text};
  font-size: 17px;
  line-height: 1.3;
  margin: 0;
`;

const RelatedExcerpt = styled.p`
  color: ${(p) => p.theme.mutedStrong};
  font-size: 13px;
  line-height: 1.55;
  margin: 0;
`;

function formatDate(value: string | null) {
  if (!value) return "Draft";
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function ArticleToc({ headings }: { headings: ReturnType<typeof extractHeadings> }) {
  if (!headings.length) return null;

  const links = headings.map((heading) => (
    <TocLink key={heading.id} href={`#${heading.id}`} $level={heading.level}>
      {heading.text}
    </TocLink>
  ));

  return (
    <>
      <Sidebar>
        <TocCard>
          <TocTitle>On This Page</TocTitle>
          {links}
        </TocCard>
      </Sidebar>
      <MobileToc>
        <summary>On this page</summary>
        <TocCard as="nav" style={{ marginTop: 12, border: 0, padding: 0 }}>
          {links}
        </TocCard>
      </MobileToc>
    </>
  );
}

export default function BlogPostClient({
  post,
  relatedPosts = [],
}: {
  post: BlogPost;
  relatedPosts?: BlogPost[];
}) {
  const category = post.blog_categories?.name ?? "PMP Exam Prep";
  const headings = extractHeadings(post.content_markdown);
  const readingTime = estimateReadingTime(post.content_markdown);

  return (
    <Page>
      <BlogGlobals />
      <Hero>
        <HeroInner>
          <HeroCopy>
            <Back href="/blog">Back to Blog</Back>
            <Meta>
              {category} &bull; {formatDate(post.published_at)} &bull; {readingTime} min read
            </Meta>
            <Title>{post.title}</Title>
            {post.excerpt && <Excerpt>{post.excerpt}</Excerpt>}
          </HeroCopy>
          <HeroMedia>
            {post.featured_image_url ? (
              <HeroImage src={post.featured_image_url} alt="" loading="eager" />
            ) : (
              <FallbackMedia>
                <FallbackKicker>{category}</FallbackKicker>
                <FallbackTitle>PMP exam strategy for confident decisions</FallbackTitle>
              </FallbackMedia>
            )}
          </HeroMedia>
        </HeroInner>
      </Hero>

      <BodyWrap>
        <ArticleToc headings={headings} />
        <ArticleColumn $wide={!headings.length}>
          <Content>
            <MarkdownView markdown={post.content_markdown} headings={headings} insertMidCta />
          </Content>

          <AuthorBox>
            <AuthorTitle>Written by PMP Mastery Lab</AuthorTitle>
            <SupportingText>
              Practical PMP exam preparation resources focused on realistic exam scenarios,
              study strategy, and performance improvement.
            </SupportingText>
          </AuthorBox>

          <EndCta>
            <EndCtaTitle>Prepare with Confidence</EndCtaTitle>
            <SupportingText>
              Build exam stamina with realistic practice and clear feedback on where to focus next.
            </SupportingText>
            <BenefitGrid>
              <li>Realistic PMP-style exam simulations</li>
              <li>Practice questions</li>
              <li>Performance analytics</li>
              <li>Domain-based recommendations</li>
            </BenefitGrid>
            <ButtonRow>
              <CtaButton href="/bank/pmp" $primary>Start Free</CtaButton>
              <CtaButton href="/#pricing">View Premium</CtaButton>
            </ButtonRow>
          </EndCta>

          {relatedPosts.length > 0 && (
            <Related>
              <RelatedTitle>Related Articles</RelatedTitle>
              <RelatedGrid>
                {relatedPosts.map((related) => (
                  <RelatedCard key={related.id} href={`/blog/${related.slug}`}>
                    <RelatedMeta>
                      {related.blog_categories?.name ?? "PMP Exam Prep"} &bull; {formatDate(related.published_at)}
                    </RelatedMeta>
                    <RelatedCardTitle>{related.title}</RelatedCardTitle>
                    {related.excerpt && <RelatedExcerpt>{related.excerpt}</RelatedExcerpt>}
                  </RelatedCard>
                ))}
              </RelatedGrid>
            </Related>
          )}
        </ArticleColumn>
      </BodyWrap>
    </Page>
  );
}
