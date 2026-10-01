import type { BlogPost } from "./blog-types";
import { POSTS_A } from "./blog-data-a";
import { POSTS_B } from "./blog-data-b";

export type { BlogPost, BlogBlock } from "./blog-types";

/** Tous les articles, du plus récent au plus ancien. */
export const BLOG_POSTS: BlogPost[] = [...POSTS_A, ...POSTS_B].sort((a, b) =>
  b.date.localeCompare(a.date)
);

export const BLOG_CATEGORIES = [...new Set(BLOG_POSTS.map((p) => p.category))];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getLatestPosts(count: number): BlogPost[] {
  return BLOG_POSTS.slice(0, count);
}

/** Articles liés : même catégorie d'abord, puis les plus récents. */
export function getRelated(slug: string, count = 3): BlogPost[] {
  const current = getPost(slug);
  if (!current) return getLatestPosts(count);
  const sameCat = BLOG_POSTS.filter((p) => p.slug !== slug && p.category === current.category);
  const others = BLOG_POSTS.filter((p) => p.slug !== slug && p.category !== current.category);
  return [...sameCat, ...others].slice(0, count);
}

/** Blocs FAQ d'un article (pour le JSON-LD FAQPage). */
export function getPostFaq(post: BlogPost): { q: string; a: string }[] {
  return post.blocks.flatMap((b) => (b.type === "faq" ? b.items : []));
}
