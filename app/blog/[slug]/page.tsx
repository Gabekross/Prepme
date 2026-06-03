import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostClient from "./BlogPostClient";
import { getPublishedPost, listRelatedPosts, siteUrl } from "@/src/marketing/publicBlog";

export const revalidate = 300;
export const dynamic = "force-dynamic";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedPost(params.slug);
  if (!post) return {};

  const canonical = post.canonical_url?.startsWith("http")
    ? post.canonical_url
    : `${siteUrl()}${post.canonical_url || `/blog/${post.slug}`}`;

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
    alternates: { canonical },
    openGraph: {
      title: post.og_title || post.seo_title || post.title,
      description: post.og_description || post.seo_description || post.excerpt || undefined,
      type: "article",
      url: canonical,
      publishedTime: post.published_at ?? undefined,
      images: post.og_image_url || post.featured_image_url ? [post.og_image_url || post.featured_image_url || ""] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.og_title || post.seo_title || post.title,
      description: post.og_description || post.seo_description || post.excerpt || undefined,
      images: post.og_image_url || post.featured_image_url ? [post.og_image_url || post.featured_image_url || ""] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPublishedPost(params.slug);
  if (!post) notFound();
  const relatedPosts = await listRelatedPosts(post);

  const canonical = post.canonical_url?.startsWith("http")
    ? post.canonical_url
    : `${siteUrl()}${post.canonical_url || `/blog/${post.slug}`}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seo_description || post.excerpt,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    mainEntityOfPage: canonical,
    author: {
      "@type": "Organization",
      name: "PMP Mastery Lab",
    },
    publisher: {
      "@type": "Organization",
      name: "PMP Mastery Lab",
    },
    image: post.og_image_url || post.featured_image_url || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostClient post={post} relatedPosts={relatedPosts} />
    </>
  );
}
