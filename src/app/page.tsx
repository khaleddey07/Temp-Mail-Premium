import type { Metadata } from "next";
import TempMailApp from "@/components/temp-mail-app";
import { LiveStats, HowItWorks, Features, Privacy, FaqPreview, Cta } from "@/components/landing-sections";
import AdSlot from "@/components/ads/ad-slot";
import PostCard from "@/components/blog/post-card";
import { getLatestPosts } from "@/content/blog";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "TempMail Premium — Adresse E-mail Temporaire Gratuite & Sécurisée",
  description:
    "Créez une adresse e-mail temporaire en 1 clic : réception instantanée, QR Code, compte à rebours, recherche, mode sombre. Gratuit, anonyme, sans inscription.",
};

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <TempMailApp />
      <AdSlot slot="top" format="horizontal" className="mt-10" />
      <LiveStats />
      <HowItWorks />
      <Features />
      <AdSlot slot="mid" className="mt-14" />
      <Privacy />
      <FaqPreview />
      <Cta />

      {/* Teaser blog — maillage interne SEO */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">
              <BookOpen size={15} /> Le blog
            </span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: "var(--text)" }}>
              Conseils anti-spam &amp; vie privée
            </h2>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {getLatestPosts(3).map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      </section>

      {/* SEO content block */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="card rounded-3xl p-8 text-sm leading-relaxed sm:p-10" style={{ color: "var(--text-muted)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
            E-mail temporaire : la solution anti-spam définitive
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <p>
              Un <strong>e-mail temporaire</strong>, aussi appelé adresse jetable ou « temp mail », est une boîte
              de réception à usage unique qui vous permet de recevoir des messages sans révéler votre véritable
              adresse. Fini les newsletters non sollicitées, le démarchage et la revente de vos données :
              utilisez une adresse différente pour chaque inscription, essai gratuit ou téléchargement.
            </p>
            <p>
              <strong>TempMail Premium</strong> va plus loin qu&apos;un simple générateur d&apos;adresse : réception
              en temps réel avec actualisation automatique, <strong>QR Code</strong> pour le partage mobile,
              compte à rebours avec prolongation, recherche instantanée, pièces jointes, mode sombre soigné
              et destruction automatique garantie. Le tout gratuitement, sans compte et en français.
            </p>
          </div>
        </div>
      </section>

      <AdSlot slot="footer" format="horizontal" className="mt-14" />
    </>
  );
}
