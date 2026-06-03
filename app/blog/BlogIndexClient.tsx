"use client";

import Link from "next/link";
import styled, { keyframes } from "styled-components";
import type { BlogPost } from "@/src/marketing/types";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 42px 20px 80px;
  animation: ${fadeUp} 260ms ease both;
`;

const Header = styled.header`
  margin-bottom: 28px;
`;

const Eyebrow = styled.div`
  color: ${(p) => p.theme.accent};
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
`;

const Title = styled.h1`
  color: ${(p) => p.theme.text};
  font-size: clamp(32px, 6vw, 54px);
  line-height: 1;
  letter-spacing: 0;
  margin: 0 0 12px;
`;

const Subtitle = styled.p`
  color: ${(p) => p.theme.mutedStrong};
  font-size: 17px;
  line-height: 1.6;
  max-width: 720px;
  margin: 0;
`;

const List = styled.div`
  display: grid;
  gap: 14px;
`;

const Card = styled(Link)`
  display: grid;
  gap: 8px;
  color: inherit;
  text-decoration: none;
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 8px;
  padding: 20px;
  transition: border-color 150ms ease, transform 150ms ease;

  &:hover {
    border-color: ${(p) => p.theme.accent};
    transform: translateY(-1px);
  }
`;

const CardTitle = styled.h2`
  color: ${(p) => p.theme.text};
  font-size: 22px;
  line-height: 1.25;
  margin: 0;
`;

const Excerpt = styled.p`
  color: ${(p) => p.theme.mutedStrong};
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
`;

const Meta = styled.div`
  color: ${(p) => p.theme.muted};
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const Empty = styled.div`
  color: ${(p) => p.theme.mutedStrong};
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 8px;
  padding: 18px;
`;

function formatDate(value: string | null) {
  if (!value) return "Draft";
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogIndexClient({ posts }: { posts: BlogPost[] }) {
  return (
    <Page>
      <Header>
        <Eyebrow>PMP Mastery Lab Blog</Eyebrow>
        <Title>PMP Exam Prep Insights</Title>
        <Subtitle>
          Practical PMP study guidance, PMI mindset patterns, agile and hybrid delivery concepts,
          and exam strategy built for candidates who want clearer decisions.
        </Subtitle>
      </Header>

      <List>
        {posts.length === 0 && <Empty>No blog articles have been published yet.</Empty>}
        {posts.map((post) => (
          <Card key={post.id} href={`/blog/${post.slug}`}>
            <Meta>
              {post.blog_categories?.name ?? "PMP Exam Prep"} · {formatDate(post.published_at)}
            </Meta>
            <CardTitle>{post.title}</CardTitle>
            {post.excerpt && <Excerpt>{post.excerpt}</Excerpt>}
          </Card>
        ))}
      </List>
    </Page>
  );
}
