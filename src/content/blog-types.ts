/* Modèle de contenu du blog TempMail Premium.
   Chaque article est un ensemble de blocs typés rendus par
   src/components/blog/blog-blocks.tsx (aucun MDX requis). */

export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "tip"; title: string; text: string }
  | { type: "steps"; items: { title: string; text: string }[] }
  | { type: "cta" }
  | { type: "faq"; items: { q: string; a: string }[] };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string; // ISO (AAAA-MM-JJ)
  readingTime: number; // minutes
  keywords: string[];
  blocks: BlogBlock[];
};
