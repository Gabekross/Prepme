import type { MetadataRoute } from "next";
import { listPublishedPosts, siteUrl } from "@/src/marketing/publicBlog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const posts = await listPublishedPosts(1000);

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
