import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { BLOG_POSTS } from "@/content/blog";
import BlogIndex from "@/components/blog/blog-index";
import AdSlot from "@/components/ads/ad-slot";

export const metadata: Metadata = {
  title: "Blog — Guides e-mail temporaire, anti-spam et vie privée",
  description:
    "Guides et astuces sur l'e-mail temporaire : éviter le spam, protéger sa boîte mail, profiter des essais gratuits sans donner sa vraie adresse. Conseils pratiques chaque semaine.",
  keywords: [
    "blog email temporaire",
    "guide adresse jetable",
    "astuces anti spam",
    "protéger vie privée email",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: "Blog TempMail Premium — Guides e-mail temporaire et vie privée",
    description:
      "Tous nos guides pour maîtriser l'e-mail temporaire : anti-spam, essais gratuits, protection de la vie privée.",
    url: "/blog",
  },
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      {/* En-tête */}
      <header className="max-w-2xl">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">
          <BookOpen size={15} /> Le blog TempMail Premium
        </span>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl" style={{ color: "var(--text)" }}>
          Guides &amp; conseils pour reprendre le contrôle de votre boîte mail
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Anti-spam, protection de la vie privée, essais gratuits sans piège, bons usages de
          l&apos;adresse jetable : des articles concrets, sans jargon, publiés chaque semaine.
        </p>
      </header>

      <div className="mt-10">
        <BlogIndex posts={BLOG_POSTS} />
      </div>

      <AdSlot slot="page" className="mt-14" />
    </div>
  );
}
