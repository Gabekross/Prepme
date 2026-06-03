"use client";

import Link from "next/link";
import styled, { keyframes } from "styled-components";
import type { BlogPost } from "@/src/marketing/types";
import { MarkdownView } from "@/src/marketing/markdown";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Page = styled.article`
  max-width: 820px;
  margin: 0 auto;
  padding: 36px 20px 84px;
  animation: ${fadeUp} 260ms ease both;
`;

const Back = styled(Link)`
  color: ${(p) => p.theme.muted};
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  &:hover { color: ${(p) => p.theme.accent}; }
`;

const Header = styled.header`
  margin: 18px 0 28px;
`;

const Meta = styled.div`
  color: ${(p) => p.theme.accent};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 10px;
`;

const Title = styled.h1`
  color: ${(p) => p.theme.text};
  font-size: clamp(34px, 6vw, 58px);
  line-height: 1;
  letter-spacing: 0;
  margin: 0 0 14px;
`;

const Excerpt = styled.p`
  color: ${(p) => p.theme.mutedStrong};
  font-size: 18px;
  line-height: 1.65;
  margin: 0;
`;

const Content = styled.div`
  color: ${(p) => p.theme.text};
  font-size: 16px;
  line-height: 1.75;

  h1, h2, h3 {
    color: ${(p) => p.theme.text};
    letter-spacing: 0;
    line-height: 1.2;
  }

  h1 { font-size: 30px; margin: 34px 0 12px; }
  h2 { font-size: 25px; margin: 32px 0 10px; }
  h3 { font-size: 20px; margin: 24px 0 8px; }

  p { margin: 0 0 16px; }
  ul { margin: 0 0 18px; padding-left: 22px; }
  li { margin-bottom: 8px; }

  a {
    color: ${(p) => p.theme.accent};
    font-weight: 700;
  }
`;

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogPostClient({ post }: { post: BlogPost }) {
  return (
    <Page>
      <Back href="/blog">Back to Blog</Back>
      <Header>
        <Meta>
          {post.blog_categories?.name ?? "PMP Exam Prep"} · {formatDate(post.published_at)}
        </Meta>
        <Title>{post.title}</Title>
        {post.excerpt && <Excerpt>{post.excerpt}</Excerpt>}
      </Header>
      <Content>
        <MarkdownView markdown={post.content_markdown} />
      </Content>
    </Page>
  );
}
