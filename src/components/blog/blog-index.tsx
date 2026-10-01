"use client";

import { useState } from "react";
import { Newspaper } from "lucide-react";
import { BLOG_CATEGORIES } from "@/content/blog";
import type { BlogPost } from "@/content/blog-types";
import PostCard from "./post-card";

export default function BlogIndex({ posts }: { posts: BlogPost[] }) {
  const [cat, setCat] = useState<string>("Tous");
  const filtered = cat === "Tous" ? posts : posts.filter((p) => p.category === cat);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {["Tous", ...BLOG_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-4 py-2 text-xs font-bold transition hover:-translate-y-0.5 ${
              cat === c ? "border-transparent bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25" : ""
            }`}
            style={cat === c ? undefined : { borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card mt-10 rounded-3xl p-12 text-center">
          <Newspaper size={36} className="mx-auto text-indigo-400" />
          <p className="mt-4 font-bold" style={{ color: "var(--text)" }}>
            Aucun article dans cette catégorie pour le moment
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Revenez bientôt : de nouveaux guides sont publiés chaque semaine.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <PostCard key={p.slug} post={p} priority={cat === "Tous" && i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
