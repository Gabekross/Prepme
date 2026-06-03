import type { Metadata } from "next";
import BlogIndexClient from "./BlogIndexClient";
import { listPublishedPosts, siteUrl } from "@/src/marketing/publicBlog";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PMP Exam Prep Blog",
  description:
    "PMP exam prep articles, PMI mindset guidance, agile and hybrid delivery concepts, and practical study strategies from PMP Mastery Lab.",
  alternates: {
    canonical: `${siteUrl()}/blog`,
  },
  openGraph: {
    title: "PMP Exam Prep Blog | PMP Mastery Lab",
    description:
      "Practical PMP exam prep articles and study guidance for project management candidates.",
    type: "website",
    url: `${siteUrl()}/blog`,
  },
};

export default async function BlogPage() {
  const posts = await listPublishedPosts();
  return <BlogIndexClient posts={posts} />;
}
