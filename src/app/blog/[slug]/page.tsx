import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Home, Tag } from "lucide-react";
import { BLOG_POSTS, getPost, getPostFaq, getRelated } from "@/content/blog";
import BlogBlocks from "@/components/blog/blog-blocks";
import PostCard from "@/components/blog/post-card";
import AdSlot from "@/components/ads/ad-slot";
import { SITE_URL } from "@/lib/temp-mail";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article introuvable" };
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      authors: ["TempMail Premium"],
    },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getRelated(post.slug);
  const faq = getPostFaq(post);
  const midIndex = Math.max(2, Math.ceil(post.blocks.length / 2));
  const blocksTop = post.blocks.slice(0, midIndex);
  const blocksBottom = post.blocks.slice(midIndex);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      inLanguage: "fr-FR",
      author: { "@type": "Organization", name: "TempMail Premium" },
      publisher: { "@type": "Organization", name: "TempMail Premium" },
      mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
      ],
    },
    ...(faq.length > 0
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Fil d'Ariane */}
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
        <Link href="/" className="flex items-center gap-1 transition hover:text-indigo-500">
          <Home size={12} /> Accueil
        </Link>
        <span>/</span>
        <Link href="/blog" className="transition hover:text-indigo-500">
          Blog
        </Link>
        <span>/</span>
        <span style={{ color: "var(--text-muted)" }}>{post.category}</span>
      </nav>

      {/* En-tête d'article */}
      <header className="mt-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-500 transition hover:gap-2.5"
        >
          <ArrowLeft size={14} /> Tous les articles
        </Link>
        <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl" style={{ color: "var(--text)" }}>
          {post.title}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {post.excerpt}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--text-faint)" }}>
          <span className="flex items-center gap-1.5">
            <CalendarDays size={13} /> Publié le {formatDate(post.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} /> {post.readingTime} min de lecture
          </span>
          <span className="flex items-center gap-1.5">
            <Tag size={13} /> {post.category}
          </span>
        </div>
      </header>

      {/* Corps — 1re moitié */}
      <article className="mt-10">
        <BlogBlocks blocks={blocksTop} />

        {/* Encart publicitaire en milieu d'article */}
        <AdSlot slot="mid" format="horizontal" className="my-10 !max-w-3xl !px-0" />

        <BlogBlocks blocks={blocksBottom} />
      </article>

      {/* Articles liés */}
      <section className="mt-16">
        <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
          À lire aussi
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      </section>

      <AdSlot slot="page" className="mt-12" />
    </div>
  );
}
