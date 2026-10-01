import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/content/blog";
import { SITE_URL } from "@/lib/temp-mail";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const now = new Date();
  const blogEntries: MetadataRoute.Sitemap = [
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...BLOG_POSTS.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: new Date(`${p.date}T12:00:00`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
  return [
    { url: base, lastModified: now, changeFrequency: "always", priority: 1 },
    ...blogEntries,
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/api-docs`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
