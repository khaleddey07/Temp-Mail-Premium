import Link from "next/link";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import type { BlogPost } from "@/content/blog-types";

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PostCard({ post, priority = false }: { post: BlogPost; priority?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`card card-hover group flex flex-col rounded-3xl p-6 ${priority ? "sm:p-7" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-500">
          {post.category}
        </span>
        {priority && (
          <span className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            À la une
          </span>
        )}
      </div>
      <h3
        className={`mt-4 font-extrabold leading-snug tracking-tight transition-colors group-hover:text-indigo-500 ${
          priority ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
        }`}
        style={{ color: "var(--text)" }}
      >
        {post.title}
      </h3>
      <p className="mt-2.5 flex-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {post.excerpt}
      </p>
      <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={13} /> {formatDate(post.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} /> {post.readingTime} min
          </span>
        </span>
        <span className="flex items-center gap-1 font-semibold text-indigo-500 opacity-0 transition-opacity group-hover:opacity-100">
          Lire <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  );
}
