"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { requireAdminServer } from "@/src/admin/requireAdmin";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { BlogPost, ContentAsset } from "@/src/marketing/types";

type Overview = {
  posts: { total: number; byStatus: Record<string, number> };
  topics: { total: number; byStatus: Record<string, number> };
  assets: { total: number; byStatus: Record<string, number> };
  blogAnalytics?: {
    periodDays: number;
    totals: {
      views: number;
      uniqueSessions: number;
      ctaClicks: number;
      practiceInteractions: number;
      deepReads: number;
    };
    topPosts: Array<{
      blogPostId: string;
      title: string;
      slug: string;
      views: number;
      ctaClicks: number;
      practiceInteractions: number;
      deepReads: number;
    }>;
  };
  categories: { id: string; name: string; slug: string }[];
};

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px 20px 72px;
  animation: ${fadeUp} 260ms ease both;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 22px;
`;

const BackLink = styled(Link)`
  color: ${(p) => p.theme.muted};
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  &:hover { color: ${(p) => p.theme.accent}; }
`;

const Title = styled.h1`
  color: ${(p) => p.theme.text};
  font-size: 28px;
  font-weight: 900;
  margin: 8px 0 4px;
  letter-spacing: -0.3px;
`;

const Subtitle = styled.p`
  color: ${(p) => p.theme.muted};
  font-size: 14px;
  margin: 0;
`;

const Button = styled.button<{ $primary?: boolean; $danger?: boolean }>`
  border: 1px solid ${(p) =>
    p.$primary ? "transparent" : p.$danger ? p.theme.errorBorder : p.theme.buttonBorder};
  background: ${(p) =>
    p.$primary ? p.theme.accent : p.$danger ? p.theme.errorSoft : p.theme.buttonBg};
  color: ${(p) =>
    p.$primary ? "#fff" : p.$danger ? p.theme.error : p.theme.text};
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${(p) =>
      p.$primary ? p.theme.accentHover : p.$danger ? p.theme.error : p.theme.buttonHover};
    color: ${(p) => (p.$danger || p.$primary ? "#fff" : p.theme.text)};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 330px 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  background: ${(p) => p.theme.cardBg};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 14px;
  padding: 16px;
  min-width: 0;
`;

const SectionTitle = styled.h2`
  color: ${(p) => p.theme.text};
  font-size: 15px;
  font-weight: 900;
  margin: 0 0 12px;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const Stat = styled.div`
  background: ${(p) => p.theme.cardBg2};
  border: 1px solid ${(p) => p.theme.cardBorder};
  border-radius: 12px;
  padding: 14px;
`;

const StatValue = styled.div`
  color: ${(p) => p.theme.accent};
  font-size: 26px;
  font-weight: 900;
`;

const StatLabel = styled.div`
  color: ${(p) => p.theme.muted};
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const TopPostList = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 14px;
`;

const TopPostRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.cardBg2};
  border-radius: 10px;
  padding: 10px 12px;
`;

const TopPostTitle = styled.div`
  color: ${(p) => p.theme.text};
  font-size: 13px;
  font-weight: 900;
  line-height: 1.35;
`;

const MetricLine = styled.div`
  color: ${(p) => p.theme.muted};
  font-size: 12px;
  margin-top: 4px;
`;

const Form = styled.form`
  display: grid;
  gap: 10px;
`;

const Label = styled.label`
  display: grid;
  gap: 5px;
  color: ${(p) => p.theme.mutedStrong};
  font-size: 12px;
  font-weight: 800;
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  border: 1px solid ${(p) => p.theme.inputBorder};
  background: ${(p) => p.theme.inputBg};
  color: ${(p) => p.theme.text};
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  outline: none;
`;

const Select = styled.select`
  width: 100%;
  box-sizing: border-box;
  border: 1px solid ${(p) => p.theme.inputBorder};
  background: ${(p) => p.theme.inputBg};
  color: ${(p) => p.theme.text};
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  outline: none;
`;

const Textarea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  border: 1px solid ${(p) => p.theme.inputBorder};
  background: ${(p) => p.theme.inputBg};
  color: ${(p) => p.theme.text};
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.5;
  min-height: 110px;
  resize: vertical;
  outline: none;
`;

const PostList = styled.div`
  display: grid;
  gap: 8px;
  max-height: 620px;
  overflow: auto;
`;

const QueueTools = styled.div`
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
`;

const StatusTabs = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const StatusTab = styled.button<{ $active?: boolean }>`
  border: 1px solid ${(p) => (p.$active ? p.theme.accent : p.theme.cardBorder)};
  background: ${(p) => (p.$active ? p.theme.accentSoft : p.theme.cardBg2)};
  color: ${(p) => (p.$active ? p.theme.accent : p.theme.mutedStrong)};
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
  text-transform: uppercase;

  &:hover {
    border-color: ${(p) => p.theme.accent};
    color: ${(p) => p.theme.accent};
  }
`;

const PostButton = styled.button<{ $active?: boolean }>`
  text-align: left;
  border: 1px solid ${(p) => (p.$active ? p.theme.accent : p.theme.cardBorder)};
  background: ${(p) => (p.$active ? p.theme.accentSoft : p.theme.cardBg2)};
  color: ${(p) => p.theme.text};
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
`;

const PostTitle = styled.div`
  font-size: 13px;
  font-weight: 900;
  line-height: 1.35;
`;

const Meta = styled.div`
  color: ${(p) => p.theme.muted};
  font-size: 12px;
  margin-top: 5px;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.cardBg2};
  color: ${(p) => p.theme.mutedStrong};
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const AssetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const AssetCard = styled.div`
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.cardBg2};
  border-radius: 12px;
  padding: 12px;
  min-width: 0;
`;

const AssetBody = styled.div`
  color: ${(p) => p.theme.text};
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  max-height: 180px;
  overflow: auto;
  margin: 8px 0 10px;
`;

const ImagePreview = styled.div`
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.cardBg2};
  border-radius: 12px;
  overflow: hidden;
  min-height: 150px;
  display: grid;
  place-items: center;
  color: ${(p) => p.theme.muted};
  font-size: 12px;
  font-weight: 800;

  img {
    width: 100%;
    height: 190px;
    object-fit: cover;
    display: block;
  }
`;

const ImagePicker = styled.div`
  display: grid;
  gap: 10px;
`;

const ImagePickerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const ImageOption = styled.div`
  border: 1px solid ${(p) => p.theme.cardBorder};
  background: ${(p) => p.theme.cardBg2};
  border-radius: 10px;
  overflow: hidden;
  min-width: 0;
`;

const ImageThumb = styled.button<{ $selected?: boolean }>`
  width: 100%;
  border: 0;
  border-bottom: 1px solid ${(p) => (p.$selected ? p.theme.accent : p.theme.cardBorder)};
  background: ${(p) => (p.$selected ? p.theme.accentSoft : p.theme.cardBg)};
  padding: 0;
  cursor: pointer;

  img {
    width: 100%;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    display: block;
  }
`;

const ImageOptionBody = styled.div`
  display: grid;
  gap: 8px;
  padding: 8px;
`;

const ImageOptionName = styled.div`
  color: ${(p) => p.theme.text};
  font-size: 11px;
  font-weight: 850;
  line-height: 1.25;
`;

const ImageOptionActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
`;

const MiniButton = styled.button`
  border: 1px solid ${(p) => p.theme.buttonBorder};
  background: ${(p) => p.theme.buttonBg};
  color: ${(p) => p.theme.text};
  border-radius: 8px;
  padding: 7px 6px;
  font-size: 11px;
  font-weight: 850;
  cursor: pointer;

  &:hover {
    background: ${(p) => p.theme.buttonHover};
  }
`;

const Message = styled.div<{ $error?: boolean }>`
  color: ${(p) => (p.$error ? p.theme.error : p.theme.mutedStrong)};
  background: ${(p) => (p.$error ? p.theme.errorSoft : p.theme.cardBg2)};
  border: 1px solid ${(p) => (p.$error ? p.theme.errorBorder : p.theme.cardBorder)};
  border-radius: 12px;
  padding: 12px;
  font-size: 13px;
  font-weight: 700;
`;

const platformUrls: Record<string, (text: string) => string> = {
  threads: () => "https://www.threads.net/",
  linkedin: () => "https://www.linkedin.com/feed/",
  x: (text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
  facebook: () => "https://www.facebook.com/",
};

const blogImageOptions = [
  { label: "PMP study dashboard", url: "/images/blog/pmp-study-dashboard.png" },
  { label: "Risk matrix planning", url: "/images/blog/risk-matrix-planning.png" },
  { label: "Agile team board", url: "/images/blog/agile-team-board.png" },
  { label: "Exam analytics dashboard", url: "/images/blog/exam-analytics-dashboard.png" },
  { label: "Servant leadership coaching", url: "/images/blog/servant-leadership-coaching.png" },
  { label: "Stakeholder mapping", url: "/images/blog/stakeholder-mapping.png" },
  { label: "Hybrid project workflow", url: "/images/blog/hybrid-project-workflow.png" },
  { label: "Calm exam-day prep", url: "/images/blog/calm-exam-day-prep.png" },
  { label: "Practice score improvement", url: "/images/blog/practice-score-improvement.png" },
  { label: "Project decision-making", url: "/images/blog/project-decision-making.png" },
];

const queueStatuses: Array<{ value: "all" | BlogPost["status"]; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "Review" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default function MarketingHubClient() {
  const [checked, setChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [theme, setTheme] = useState("PMP Exam Prep");
  const [categoryId, setCategoryId] = useState("");
  const [scheduleFor, setScheduleFor] = useState("");
  const [queueStatus, setQueueStatus] = useState<"all" | BlogPost["status"]>("all");
  const [queueSearch, setQueueSearch] = useState("");

  const postCounts = useMemo(() => overview?.posts.byStatus ?? {}, [overview]);
  const analytics = overview?.blogAnalytics;
  const analyticsByPost = useMemo(() => {
    return new Map((analytics?.topPosts ?? []).map((post) => [post.blogPostId, post]));
  }, [analytics?.topPosts]);
  const filteredPosts = useMemo(() => {
    const search = queueSearch.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesStatus = queueStatus === "all" || post.status === queueStatus;
      const matchesSearch =
        !search ||
        post.title.toLowerCase().includes(search) ||
        post.slug.toLowerCase().includes(search) ||
        (post.blog_categories?.name ?? "").toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [posts, queueSearch, queueStatus]);

  useEffect(() => {
    requireAdminServer().then((result) => {
      if (!result.ok) {
        const messages: Record<string, string> = {
          not_signed_in: "You must be signed in to view this page.",
          not_admin: "You do not have admin access.",
          verification_failed: "Could not verify admin role.",
        };
        setAuthError(messages[result.reason] ?? "Access denied.");
      }
      setChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!checked || authError) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, authError]);

  async function getToken() {
    const sb = supabaseBrowser();
    const { data } = await sb.auth.getSession();
    return data.session?.access_token;
  }

  async function api(path: string, init?: RequestInit) {
    const token = await getToken();
    if (!token) throw new Error("Session expired");
    const res = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Request failed");
    return json;
  }

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [overviewJson, postsJson] = await Promise.all([
        api("/api/admin/marketing/overview"),
        api("/api/admin/marketing/posts"),
      ]);
      setOverview(overviewJson);
      setPosts(postsJson.posts);
      if (!activePost && postsJson.posts[0]) await loadPost(postsJson.posts[0].id);
    } catch (err: any) {
      setError(err.message ?? "Could not load Marketing Hub.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPost(id: string) {
    setError(null);
    try {
      const json = await api(`/api/admin/marketing/posts/${id}`);
      setActivePost(json.post);
      setAssets(json.assets);
    } catch (err: any) {
      setError(err.message ?? "Could not load post.");
    }
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setWorking(true);
    setMessage(null);
    setError(null);
    try {
      const json = await api("/api/admin/marketing/generate", {
        method: "POST",
        body: JSON.stringify({ topic, primaryKeyword, theme, categoryId }),
      });
      setTopic("");
      setPrimaryKeyword("");
      setMessage(
        json.generation.usedFallback
          ? "Generated with the local fallback template. Add OPENAI_API_KEY for AI generation."
          : "Content pyramid generated and queued for review."
      );
      await loadAll();
      await loadPost(json.post.id);
    } catch (err: any) {
      setError(err.message ?? "Generation failed.");
    } finally {
      setWorking(false);
    }
  }

  async function savePost(status?: "approved") {
    if (!activePost) return;
    setWorking(true);
    setError(null);
    try {
      const json = await api(`/api/admin/marketing/posts/${activePost.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: activePost.title,
          slug: activePost.slug,
          excerpt: activePost.excerpt,
          content_markdown: activePost.content_markdown,
          seo_title: activePost.seo_title,
          seo_description: activePost.seo_description,
          focus_keyword: activePost.focus_keyword,
          category_id: activePost.category_id,
          featured_image_url: activePost.featured_image_url,
          og_image_url: activePost.og_image_url,
          status,
        }),
      });
      setActivePost(json.post);
      setMessage(status === "approved" ? "Post approved." : "Post saved.");
      await loadAll();
    } catch (err: any) {
      setError(err.message ?? "Could not save post.");
    } finally {
      setWorking(false);
    }
  }

  async function updatePostStatus(status: "review" | "archived") {
    if (!activePost) return;
    const label = status === "review" ? "unpublish" : "archive";
    if (!window.confirm(`Are you sure you want to ${label} this blog post?`)) return;

    setWorking(true);
    setError(null);
    try {
      const json = await api(`/api/admin/marketing/posts/${activePost.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setActivePost(json.post);
      setMessage(status === "review" ? "Post unpublished and moved back to review." : "Post archived.");
      await loadAll();
      await loadPost(json.post.id);
    } catch (err: any) {
      setError(err.message ?? "Could not update post status.");
    } finally {
      setWorking(false);
    }
  }

  async function deletePost() {
    if (!activePost) return;
    const confirmed = window.confirm(
      `Permanently delete "${activePost.title}"? This removes the blog post and generated channel assets. This cannot be undone.`
    );
    if (!confirmed) return;

    setWorking(true);
    setError(null);
    try {
      await api(`/api/admin/marketing/posts/${activePost.id}`, {
        method: "DELETE",
      });
      setActivePost(null);
      setAssets([]);
      setMessage("Post deleted.");
      await loadAll();
    } catch (err: any) {
      setError(err.message ?? "Could not delete post.");
    } finally {
      setWorking(false);
    }
  }

  async function publish(mode: "now" | "schedule") {
    if (!activePost) return;
    setWorking(true);
    setError(null);
    try {
      const json = await api(`/api/admin/marketing/posts/${activePost.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ mode, scheduledFor: scheduleFor ? new Date(scheduleFor).toISOString() : null }),
      });
      setActivePost(json.post);
      setMessage(mode === "schedule" ? "Post scheduled." : "Post published to the website.");
      await loadAll();
    } catch (err: any) {
      setError(err.message ?? "Could not publish post.");
    } finally {
      setWorking(false);
    }
  }

  async function copyAsset(asset: ContentAsset) {
    await navigator.clipboard.writeText(asset.body);
    setMessage(`${asset.channel} content copied.`);
    const json = await api(`/api/admin/marketing/assets/${asset.id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "copied" }),
    });
    setAssets((prev) => prev.map((item) => (item.id === asset.id ? json.asset : item)));
  }

  async function openPlatform(asset: ContentAsset) {
    const fn = platformUrls[asset.channel];
    if (!fn) return;
    await copyAsset(asset);
    window.open(fn(asset.body), "_blank", "noopener,noreferrer");
  }

  if (!checked || loading) {
    return (
      <Page>
        <Message>Loading Marketing Hub...</Message>
      </Page>
    );
  }

  if (authError) {
    return (
      <Page>
        <Message $error>{authError}</Message>
      </Page>
    );
  }

  return (
    <Page>
      <Header>
        <div>
          <BackLink href="/admin">Back to Admin</BackLink>
          <Title>Marketing Hub</Title>
          <Subtitle>Blog-first content generation, review, publishing, and channel repurposing.</Subtitle>
        </div>
        <Row>
          <Button onClick={() => loadAll()} disabled={working}>Refresh</Button>
          {activePost?.status === "published" && (
            <Button as="a" href={`/blog/${activePost.slug}`} target="_blank" rel="noreferrer">
              View Blog
            </Button>
          )}
        </Row>
      </Header>

      {message && <Message style={{ marginBottom: 14 }}>{message}</Message>}
      {error && <Message $error style={{ marginBottom: 14 }}>{error}</Message>}

      <StatGrid>
        <Stat>
          <StatValue>{overview?.posts.total ?? 0}</StatValue>
          <StatLabel>Blog Posts</StatLabel>
          <Meta>{postCounts.review ?? 0} in review, {postCounts.published ?? 0} published</Meta>
        </Stat>
        <Stat>
          <StatValue>{overview?.topics.total ?? 0}</StatValue>
          <StatLabel>Topics</StatLabel>
          <Meta>Ideas and generated content briefs</Meta>
        </Stat>
        <Stat>
          <StatValue>{overview?.assets.total ?? 0}</StatValue>
          <StatLabel>Channel Assets</StatLabel>
          <Meta>Social and newsletter derivatives</Meta>
        </Stat>
      </StatGrid>

      <Panel style={{ marginBottom: 16 }}>
        <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <SectionTitle style={{ margin: 0 }}>Blog Analytics</SectionTitle>
          <Meta>Last {analytics?.periodDays ?? 30} days</Meta>
        </Row>
        <AnalyticsGrid>
          <Stat>
            <StatValue>{analytics?.totals.views ?? 0}</StatValue>
            <StatLabel>Views</StatLabel>
          </Stat>
          <Stat>
            <StatValue>{analytics?.totals.uniqueSessions ?? 0}</StatValue>
            <StatLabel>Sessions</StatLabel>
          </Stat>
          <Stat>
            <StatValue>{analytics?.totals.ctaClicks ?? 0}</StatValue>
            <StatLabel>CTA Clicks</StatLabel>
          </Stat>
          <Stat>
            <StatValue>{analytics?.totals.deepReads ?? 0}</StatValue>
            <StatLabel>Deep Reads</StatLabel>
          </Stat>
          <Stat>
            <StatValue>{analytics?.totals.practiceInteractions ?? 0}</StatValue>
            <StatLabel>Practice Actions</StatLabel>
          </Stat>
        </AnalyticsGrid>
        <TopPostList>
          {analytics?.topPosts.length ? analytics.topPosts.map((post) => (
            <TopPostRow key={post.blogPostId}>
              <div>
                <TopPostTitle>{post.title}</TopPostTitle>
                <MetricLine>
                  {post.views} views &bull; {post.ctaClicks} CTA clicks &bull; {post.deepReads} deep reads
                </MetricLine>
              </div>
              {post.slug && <Button as="a" href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">Open</Button>}
            </TopPostRow>
          )) : (
            <Message>No blog analytics yet. New events will appear here after readers visit published posts.</Message>
          )}
        </TopPostList>
      </Panel>

      <Grid>
        <div style={{ display: "grid", gap: 16 }}>
          <Panel>
            <SectionTitle>Generate Content</SectionTitle>
            <Form onSubmit={generate}>
              <Label>
                Topic
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Servant Leadership for PMP" />
              </Label>
              <Label>
                Primary Keyword
                <Input value={primaryKeyword} onChange={(e) => setPrimaryKeyword(e.target.value)} placeholder="servant leadership PMP" />
              </Label>
              <Label>
                Theme
                <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
                  <option>PMP Exam Prep</option>
                  <option>PMI Mindset</option>
                  <option>Agile and Hybrid</option>
                  <option>Leadership</option>
                  <option>Stakeholder Management</option>
                  <option>Risk Management</option>
                  <option>Career Growth</option>
                  <option>Product Features</option>
                </Select>
              </Label>
              <Label>
                Blog Category
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Uncategorized</option>
                  {overview?.categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </Select>
              </Label>
              <Button $primary type="submit" disabled={working || topic.trim().length < 3}>
                {working ? "Generating..." : "Generate Pyramid"}
              </Button>
            </Form>
          </Panel>

          <Panel>
            <SectionTitle>Blog Queue</SectionTitle>
            <QueueTools>
              <Input
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                placeholder="Search title, slug, or category"
              />
              <StatusTabs>
                {queueStatuses.map((status) => (
                  <StatusTab
                    key={status.value}
                    type="button"
                    $active={queueStatus === status.value}
                    onClick={() => setQueueStatus(status.value)}
                  >
                    {status.label}
                    {status.value !== "all" && typeof postCounts[status.value] === "number"
                      ? ` ${postCounts[status.value]}`
                      : ""}
                  </StatusTab>
                ))}
              </StatusTabs>
              <Meta>
                Showing {filteredPosts.length} of {posts.length} posts
              </Meta>
            </QueueTools>
            <PostList>
              {posts.length === 0 && <Message>No marketing content yet.</Message>}
              {posts.length > 0 && filteredPosts.length === 0 && (
                <Message>No posts match this queue filter.</Message>
              )}
              {filteredPosts.map((post) => (
                <PostButton
                  key={post.id}
                  $active={activePost?.id === post.id}
                  onClick={() => loadPost(post.id)}
                >
                  <PostTitle>{post.title}</PostTitle>
                  <Meta>
                    <Badge>{post.status}</Badge>{" "}
                    {post.blog_categories?.name ?? "Uncategorized"}
                    {analyticsByPost.has(post.id) && (
                      <> &bull; {analyticsByPost.get(post.id)?.views ?? 0} views</>
                    )}
                  </Meta>
                </PostButton>
              ))}
            </PostList>
          </Panel>
        </div>

        <Panel>
          {!activePost ? (
            <Message>Select or generate a blog post to begin review.</Message>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <SectionTitle style={{ margin: 0 }}>Review Blog Source</SectionTitle>
                <Badge>{activePost.status}</Badge>
              </Row>

              <TwoCol>
                <Label>
                  Title
                  <Input
                    value={activePost.title}
                    onChange={(e) => setActivePost({ ...activePost, title: e.target.value })}
                  />
                </Label>
                <Label>
                  Slug
                  <Input
                    value={activePost.slug}
                    onChange={(e) => setActivePost({ ...activePost, slug: e.target.value })}
                  />
                </Label>
              </TwoCol>

              <Label>
                Excerpt
                <Textarea
                  value={activePost.excerpt ?? ""}
                  onChange={(e) => setActivePost({ ...activePost, excerpt: e.target.value })}
                  style={{ minHeight: 74 }}
                />
              </Label>

              <Label>
                Blog Article Markdown
                <Textarea
                  value={activePost.content_markdown}
                  onChange={(e) => setActivePost({ ...activePost, content_markdown: e.target.value })}
                  style={{ minHeight: 280 }}
                />
              </Label>

              <TwoCol>
                <Label>
                  SEO Title
                  <Input
                    value={activePost.seo_title ?? ""}
                    onChange={(e) => setActivePost({ ...activePost, seo_title: e.target.value })}
                  />
                </Label>
                <Label>
                  Focus Keyword
                  <Input
                    value={activePost.focus_keyword ?? ""}
                    onChange={(e) => setActivePost({ ...activePost, focus_keyword: e.target.value })}
                  />
                </Label>
              </TwoCol>

              <Label>
                SEO Description
                <Textarea
                  value={activePost.seo_description ?? ""}
                  onChange={(e) => setActivePost({ ...activePost, seo_description: e.target.value })}
                  style={{ minHeight: 70 }}
                />
              </Label>

              <TwoCol>
                <Label>
                  Featured Image URL
                  <Input
                    value={activePost.featured_image_url ?? ""}
                    onChange={(e) => setActivePost({ ...activePost, featured_image_url: e.target.value })}
                    placeholder="/images/blog/example.jpg or https://..."
                  />
                </Label>
                <Label>
                  Social Image URL
                  <Input
                    value={activePost.og_image_url ?? ""}
                    onChange={(e) => setActivePost({ ...activePost, og_image_url: e.target.value })}
                    placeholder="Optional Open Graph image URL"
                  />
                </Label>
              </TwoCol>

              <ImagePicker>
                <SectionTitle style={{ margin: 0 }}>Image Library</SectionTitle>
                <ImagePickerGrid>
                  {blogImageOptions.map((image) => {
                    const isFeatured = activePost.featured_image_url === image.url;
                    const isSocial = activePost.og_image_url === image.url;

                    return (
                      <ImageOption key={image.url}>
                        <ImageThumb
                          type="button"
                          $selected={isFeatured || isSocial}
                          onClick={() => setActivePost({ ...activePost, featured_image_url: image.url })}
                          title={`Use ${image.label} as featured image`}
                        >
                          <img src={image.url} alt={image.label} loading="lazy" />
                        </ImageThumb>
                        <ImageOptionBody>
                          <ImageOptionName>{image.label}</ImageOptionName>
                          <ImageOptionActions>
                            <MiniButton
                              type="button"
                              onClick={() => setActivePost({ ...activePost, featured_image_url: image.url })}
                            >
                              Featured
                            </MiniButton>
                            <MiniButton
                              type="button"
                              onClick={() => setActivePost({ ...activePost, og_image_url: image.url })}
                            >
                              Social
                            </MiniButton>
                          </ImageOptionActions>
                        </ImageOptionBody>
                      </ImageOption>
                    );
                  })}
                </ImagePickerGrid>
              </ImagePicker>

              <ImagePreview>
                {activePost.featured_image_url ? (
                  <img src={activePost.featured_image_url} alt="Featured image preview" />
                ) : (
                  "Featured image preview"
                )}
              </ImagePreview>

              <Row>
                <Button onClick={() => savePost()} disabled={working}>Save Review</Button>
                <Button onClick={() => savePost("approved")} disabled={working || activePost.status === "published"}>
                  Approve
                </Button>
                <Button $primary onClick={() => publish("now")} disabled={working}>
                  Publish Now
                </Button>
                <Input
                  type="datetime-local"
                  value={scheduleFor}
                  onChange={(e) => setScheduleFor(e.target.value)}
                  style={{ maxWidth: 220 }}
                />
                <Button onClick={() => publish("schedule")} disabled={working || !scheduleFor}>
                  Schedule
                </Button>
                {activePost.status === "published" && (
                  <Button onClick={() => updatePostStatus("review")} disabled={working}>
                    Unpublish
                  </Button>
                )}
                {activePost.status !== "archived" && (
                  <Button onClick={() => updatePostStatus("archived")} disabled={working}>
                    Archive
                  </Button>
                )}
                <Button $danger onClick={deletePost} disabled={working}>
                  Delete
                </Button>
              </Row>

              <SectionTitle>Derived Channel Assets</SectionTitle>
              <AssetGrid>
                {assets.map((asset) => (
                  <AssetCard key={asset.id}>
                    <Row style={{ justifyContent: "space-between" }}>
                      <Badge>{asset.channel} {asset.variant}</Badge>
                      <Badge>{asset.status}</Badge>
                    </Row>
                    {asset.title && <PostTitle style={{ marginTop: 8 }}>{asset.title}</PostTitle>}
                    <AssetBody>{asset.body}</AssetBody>
                    <Row>
                      <Button onClick={() => copyAsset(asset)}>Copy</Button>
                      {platformUrls[asset.channel] && (
                        <Button onClick={() => openPlatform(asset)}>Open Platform</Button>
                      )}
                    </Row>
                  </AssetCard>
                ))}
              </AssetGrid>
            </div>
          )}
        </Panel>
      </Grid>
    </Page>
  );
}
