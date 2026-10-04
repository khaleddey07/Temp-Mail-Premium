"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import DOMPurify from "dompurify";
import {
  Copy,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  QrCode,
  Clock,
  Inbox,
  Search,
  MailOpen,
  Mail,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  Zap,
  ShieldCheck,
  Timer,
  X,
  Eye,
  EyeOff,
  Download,
  FileText,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Bell,
  BellOff,
} from "lucide-react";
import { useToast } from "./providers";
import { ConnectionPill } from "./site-chrome";
import { FALLBACK_DOMAINS } from "@/lib/temp-mail";

/* ============ Types ============ */
interface Address {
  id: string;
  email: string;
  localPart: string;
  domain: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  extendedCount: number;
  messageCount?: number;
}

interface Attachment {
  id?: string;
  filename: string;
  size: string;
  mime: string;
  downloadUrl?: string;
}

interface Msg {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  preview: string;
  bodyText: string;
  bodyHtml: string | null;
  isRead: boolean;
  hasAttachments: boolean;
  attachments: Attachment[];
  receivedAt: string;
  sizeBytes: number;
}

type Filter = "all" | "unread" | "read" | "attachments";

/* ============ Helpers ============ */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 10) return "à l'instant";
  if (s < 60) return `il y a ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalS = Math.floor(ms / 1000);
  const h = Math.floor(totalS / 3600);
  const m = Math.floor((totalS % 3600) / 60);
  const s = totalS % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function avatarColor(name: string): string {
  const gradients = [
    "from-indigo-500 to-violet-500",
    "from-rose-500 to-orange-500",
    "from-emerald-500 to-teal-500",
    "from-sky-500 to-blue-600",
    "from-fuchsia-500 to-purple-600",
    "from-amber-500 to-red-500",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % gradients.length;
  return gradients[h];
}

export default function TempMailApp({ onAddressChange }: { onAddressChange?: () => void }) {
  const { notify } = useToast();
  const [address, setAddress] = useState<Address | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [extending, setExtending] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<Msg | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [showHtml, setShowHtml] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showDeleteAddr, setShowDeleteAddr] = useState(false);
  const [showClearInbox, setShowClearInbox] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [live, setLive] = useState(true);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const searchRef = useRef<HTMLInputElement>(null);
  const prevIds = useRef<Set<string>>(new Set());
  const [domains, setDomains] = useState<string[]>([...FALLBACK_DOMAINS]);

  /* ---- Domaines réels (mail.tm) ---- */
  useEffect(() => {
    fetch("/api/domains")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.domains) && d.domains.length > 0) setDomains(d.domains);
      })
      .catch(() => {});
  }, []);

  /* ---- Countdown ticker ---- */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ---- Debounce search ---- */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  /* ---- Keyboard shortcut: / focuses search ---- */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  /* ---- Fetch messages ---- */
  const fetchMessages = useCallback(
    async (addrId: string, tok: string, opts?: { silent?: boolean; q?: string; f?: Filter }) => {
      const query = opts?.q ?? debouncedSearch;
      const flt = opts?.f ?? filter;
      if (!opts?.silent) setRefreshing(true);
      try {
        const params = new URLSearchParams({ token: tok });
        if (query) params.set("search", query);
        if (flt !== "all") params.set("filter", flt);
        const res = await fetch(`/api/addresses/${addrId}/messages?${params.toString()}`);
        if (res.status === 410) {
          setAddress(null);
          setMessages([]);
          localStorage.removeItem("tempmail-token");
          notify("warning", "Adresse expirée", "Votre adresse temporaire a expiré. Créez-en une nouvelle.");
          return;
        }
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        const list: Msg[] = data.messages ?? [];

        // Detect new arrivals for notification
        if (prevIds.current.size > 0 && !query && flt === "all") {
          const newcomers = list.filter((m) => !prevIds.current.has(m.id));
          if (newcomers.length > 0) {
            notify("info", newcomers.length === 1 ? "Nouvel e-mail reçu" : `${newcomers.length} nouveaux e-mails`, newcomers[0].subject);
          }
        }
        prevIds.current = new Set(list.map((m) => m.id));

        setMessages(list);
        setTotal(data.total ?? list.length);
        setUnread(data.unread ?? 0);
        setLive(true);
      } catch {
        setLive(false);
      } finally {
        setRefreshing(false);
      }
    },
    [debouncedSearch, filter, notify]
  );

  /* ---- Init: restore or create address ---- */
  const init = useCallback(async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem("tempmail-token");
      if (stored) {
        const res = await fetch(`/api/addresses?token=${encodeURIComponent(stored)}`);
        const data = await res.json();
        if (data.address) {
          setAddress(data.address);
          setToken(stored);
          await fetchMessages(data.address.id, stored, { silent: true });
          setLoading(false);
          return;
        } else {
          localStorage.removeItem("tempmail-token");
        }
      }
      // Create fresh
      const res = await fetch("/api/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (data.address) {
        setAddress(data.address);
        setToken(data.address.token);
        localStorage.setItem("tempmail-token", data.address.token);
        await fetchMessages(data.address.id, data.address.token, { silent: true });
      }
    } catch {
      notify("error", "Erreur de connexion", "Impossible de joindre le serveur. Réessayez.");
      setLive(false);
    } finally {
      setLoading(false);
    }
  }, [fetchMessages, notify]);

  useEffect(() => {
    init();
  }, []);

  /* ---- Auto-refresh polling 4s (en pause quand l'onglet est caché) ---- */
  useEffect(() => {
    if (!autoRefresh || !address || !token) return;
    const tick = () => {
      if (!document.hidden) fetchMessages(address.id, token, { silent: true });
    };
    const t = setInterval(tick, 4000);
    const onVisible = () => {
      if (!document.hidden) fetchMessages(address.id, token, { silent: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [autoRefresh, address, token, fetchMessages]);

  /* ---- Refetch on search/filter change ---- */
  useEffect(() => {
    if (!address || !token || loading) return;
    fetchMessages(address.id, token, { silent: true });
  }, [debouncedSearch, filter]);

  /* ---- Select message ---- */
  const selectMessage = async (id: string) => {
    if (!token) return;
    setSelectedId(id);
    setMobileView("detail");
    setLoadingMsg(true);
    try {
      const res = await fetch(`/api/messages/${id}?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data.message) {
        setSelectedMsg(data.message);
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
        setUnread((u) => Math.max(0, u - (messages.find((m) => m.id === id && !m.isRead) ? 1 : 0)));
      }
    } catch {
      notify("error", "Erreur", "Impossible d'ouvrir ce message.");
    } finally {
      setLoadingMsg(false);
    }
  };

  /* ---- Actions ---- */
  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address.email);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = address.email;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    notify("success", "Adresse copiée !", address.email);
    setTimeout(() => setCopied(false), 2000);
  };

  const createAddress = async (localPart?: string, domain?: string) => {
    setCreating(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localPart, domain, oldToken: token }),
      });
      const data = await res.json();
      if (data.address) {
        setAddress(data.address);
        setToken(data.address.token);
        localStorage.setItem("tempmail-token", data.address.token);
        setSelectedId(null);
        setSelectedMsg(null);
        setSearch("");
        setFilter("all");
        prevIds.current = new Set();
        await fetchMessages(data.address.id, data.address.token, { silent: true, q: "", f: "all" });
        notify("success", "Nouvelle adresse créée", data.address.email);
        onAddressChange?.();
        setShowNew(false);
      }
    } catch {
      notify("error", "Erreur", "Impossible de créer une adresse.");
    } finally {
      setCreating(false);
    }
  };

  const extendAddress = async () => {
    if (!address || !token) return;
    setExtending(true);
    try {
      const res = await fetch(`/api/addresses/${address.id}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify("error", "Prolongation impossible", data.error ?? "Erreur inconnue");
        return;
      }
      setAddress(data.address);
      notify("success", "Adresse prolongée de 60 min", `Nouvelle expiration : ${new Date(data.address.expiresAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`);
    } catch {
      notify("error", "Erreur", "Prolongation impossible.");
    } finally {
      setExtending(false);
    }
  };

  const deleteAddress = async () => {
    if (!address || !token) return;
    try {
      await fetch(`/api/addresses/${address.id}?token=${encodeURIComponent(token)}`, { method: "DELETE" });
      localStorage.removeItem("tempmail-token");
      setAddress(null);
      setMessages([]);
      setSelectedId(null);
      setSelectedMsg(null);
      prevIds.current = new Set();
      setShowDeleteAddr(false);
      notify("success", "Adresse supprimée", "Toutes les données ont été effacées.");
      // auto-create a new one
      await createAddress();
    } catch {
      notify("error", "Erreur", "Suppression impossible.");
    }
  };

  const deleteMessage = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/messages/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      if (selectedId === id) {
        setSelectedId(null);
        setSelectedMsg(null);
        setMobileView("list");
      }
      notify("success", "Message supprimé");
    } catch {
      notify("error", "Erreur", "Suppression impossible.");
    }
  };

  const toggleRead = async (id: string, current: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, isRead: !current }),
      });
      const data = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: data.isRead } : m)));
      if (selectedId === id && selectedMsg) setSelectedMsg({ ...selectedMsg, isRead: data.isRead });
      setUnread((u) => u + (data.isRead ? -1 : 1));
    } catch {
      notify("error", "Erreur", "Action impossible.");
    }
  };

  const clearInbox = async () => {
    if (!address || !token) return;
    try {
      await fetch(`/api/addresses/${address.id}/messages?token=${encodeURIComponent(token)}`, { method: "DELETE" });
      setMessages([]);
      setTotal(0);
      setUnread(0);
      setSelectedId(null);
      setSelectedMsg(null);
      prevIds.current = new Set();
      setShowClearInbox(false);
      notify("success", "Boîte vidée", "Tous les messages ont été supprimés.");
    } catch {
      notify("error", "Erreur", "Impossible de vider la boîte.");
    }
  };

  /* ---- Téléchargement réel de pièce jointe (proxy serveur) ---- */
  const downloadAttachment = (att: Attachment) => {
    if (!att.downloadUrl) {
      notify("info", "Pièce jointe simulée", `${att.filename} (${att.size})`);
      return;
    }
    const a = document.createElement("a");
    a.href = att.downloadUrl;
    a.download = att.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    notify("success", "Téléchargement lancé", att.filename);
  };

  /* ---- Derived ---- */
  const remaining = address ? new Date(address.expiresAt).getTime() - now : 0;
  const totalLife = useMemo(() => {
    if (!address) return 1;
    const created = new Date(address.createdAt).getTime();
    const expires = new Date(address.expiresAt).getTime();
    return Math.max(1, expires - created);
  }, [address]);
  const progress = address ? Math.max(0, Math.min(1, remaining / totalLife)) : 0;
  const expired = remaining <= 0;
  const attachmentsCount = messages.filter((m) => m.hasAttachments).length;

  const sanitizedHtml = useMemo(() => {
    if (!selectedMsg?.bodyHtml) return "";
    try {
      return DOMPurify.sanitize(selectedMsg.bodyHtml, { ADD_ATTR: ["target"] });
    } catch {
      return "";
    }
  }, [selectedMsg]);

  /* ================= RENDER ================= */
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="card animate-fade-in mx-auto mt-8 max-w-3xl rounded-3xl p-8">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton mt-4 h-12 w-full" />
          <div className="mt-6 flex gap-3">
            <div className="skeleton h-11 flex-1" />
            <div className="skeleton h-11 flex-1" />
            <div className="skeleton h-11 flex-1" />
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="card rounded-3xl p-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="mb-4 flex gap-3">
                <div className="skeleton h-11 w-11 !rounded-full" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-2/3" />
                  <div className="skeleton mt-2 h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
          <div className="card hidden rounded-3xl p-8 lg:block">
            <div className="skeleton h-6 w-1/2" />
            <div className="skeleton mt-4 h-4 w-full" />
            <div className="skeleton mt-2 h-4 w-full" />
            <div className="skeleton mt-2 h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* ===== HERO ===== */}
      <div className="relative mx-auto mt-6 max-w-4xl text-center sm:mt-10">
        <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold" style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--text-muted)" }}>
          <Sparkles size={14} className="text-indigo-500" />
          Vraies adresses e-mail • Réception réelle • Destruction auto
        </div>
        <h1 className="animate-fade-up stagger-1 mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl" style={{ color: "var(--text)" }}>
          Votre e-mail temporaire
          <br />
          <span className="gradient-text">en 1 seconde chrono</span>
        </h1>
        <p className="animate-fade-up stagger-2 mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed sm:text-base" style={{ color: "var(--text-muted)" }}>
          Protégez votre vraie boîte mail du spam. Copiez votre adresse ci-dessous, recevez vos
          e-mails instantanément, puis laissez tout s&apos;auto-détruire.
        </p>
      </div>

      {/* ===== ADDRESS CARD ===== */}
      <div className="animate-fade-up stagger-3 relative mx-auto mt-8 max-w-3xl">
        <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-25 blur-xl" />
        <div className="card relative overflow-hidden rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "var(--text-faint)" }}>
              <Mail size={14} className="text-indigo-500" />
              Votre adresse temporaire
            </div>
            <ConnectionPill live={live} />
          </div>

          {/* Email display */}
          <div
            className="group relative mt-4 flex items-center gap-2 rounded-2xl border-2 border-dashed p-4 transition sm:p-5"
            style={{ borderColor: "rgb(99 102 241 / 0.4)", background: "rgb(99 102 241 / 0.05)" }}
          >
            <div className="min-w-0 flex-1 text-center">
              <p className="truncate text-lg font-bold tracking-tight sm:text-2xl" style={{ color: "var(--text)" }}>
                {address?.email ?? "—"}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
                Cliquez sur copier • Valide {address ? timeAgo(address.createdAt).replace("il y a ", "depuis ") : ""} • {address?.extendedCount ? `+${address.extendedCount} prolongation(s)` : "non prolongée"}
              </p>
            </div>
          </div>

          {/* Countdown */}
          {address && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-semibold" style={{ color: expired ? "#ef4444" : "var(--text)" }}>
                  <Timer size={16} className={expired ? "text-rose-500" : "text-indigo-500"} />
                  {expired ? "Expirée" : `Expire dans ${formatCountdown(remaining)}`}
                </span>
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                  {new Date(address.expiresAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full" style={{ background: "var(--bg-muted)" }}>
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${progress < 0.15 ? "bg-gradient-to-r from-rose-500 to-red-500" : progress < 0.4 ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"}`}
                  style={{ width: `${Math.max(2, progress * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            <button onClick={copyAddress} className="btn-primary flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold">
              {copied ? <Check size={17} className="animate-tick" /> : <Copy size={17} />}
              {copied ? "Copié !" : "Copier"}
            </button>
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--text)" }}
            >
              <QrCode size={17} className="text-violet-500" />
              QR Code
            </button>
            <button
              onClick={extendAddress}
              disabled={extending}
              className="flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:opacity-50"
              style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--text)" }}
            >
              <Clock size={17} className={`text-emerald-500 ${extending ? "animate-spin" : ""}`} />
              +60 min
            </button>
            <button
              onClick={() => setShowNew(true)}
              disabled={creating}
              className="flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:opacity-50"
              style={{ borderColor: "rgb(99 102 241 / 0.4)", background: "rgb(99 102 241 / 0.08)", color: "var(--text)" }}
            >
              <Plus size={17} className="text-indigo-500" />
              Nouveau
            </button>
            <button
              onClick={() => setShowDeleteAddr(true)}
              className="col-span-2 flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-rose-400 hover:bg-rose-500/10 hover:text-rose-500 sm:col-span-1"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              <Trash2 size={17} />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* ===== STATS ===== */}
      <div className="animate-fade-up stagger-4 mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Inbox, label: "Messages", value: String(total), color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { icon: MailOpen, label: "Non lus", value: String(unread), color: "text-amber-500", bg: "bg-amber-500/10" },
          { icon: Paperclip, label: "Pièces jointes", value: String(attachmentsCount), color: "text-violet-500", bg: "bg-violet-500/10" },
          { icon: ShieldCheck, label: "Spam bloqué", value: "100%", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((s) => (
          <div key={s.label} className="card card-hover flex items-center gap-3 rounded-2xl p-3.5">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${s.bg} ${s.color}`}>
              <s.icon size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-xl font-extrabold leading-none" style={{ color: "var(--text)" }}>{s.value}</span>
              <span className="mt-1 block truncate text-xs" style={{ color: "var(--text-faint)" }}>{s.label}</span>
            </span>
          </div>
        ))}
      </div>

      {/* ===== INBOX ===== */}
      <div className="animate-fade-up stagger-5 mt-6 grid items-start gap-5 lg:grid-cols-[400px_1fr]">
        {/* List */}
        <div className={`card overflow-hidden rounded-3xl ${mobileView === "detail" ? "hidden lg:block" : ""}`}>
          {/* Toolbar */}
          <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-[15px] font-bold" style={{ color: "var(--text)" }}>
                <Inbox size={17} className="text-indigo-500" />
                Boîte de réception
                {unread > 0 && (
                  <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[11px] font-bold text-white">{unread}</span>
                )}
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`grid h-8 w-8 place-items-center rounded-lg border transition ${autoRefresh ? "border-emerald-400 bg-emerald-500/10 text-emerald-500" : ""}`}
                  style={autoRefresh ? undefined : { borderColor: "var(--border)", color: "var(--text-faint)" }}
                  title={autoRefresh ? "Actualisation auto activée (4s)" : "Actualisation auto désactivée"}
                >
                  {autoRefresh ? <Bell size={15} /> : <BellOff size={15} />}
                </button>
                <button
                  onClick={() => address && token && fetchMessages(address.id, token)}
                  className="grid h-8 w-8 place-items-center rounded-lg border transition hover:rotate-90"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                  title="Actualiser maintenant"
                >
                  <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={() => setShowClearInbox(true)}
                  className="grid h-8 w-8 place-items-center rounded-lg border transition hover:border-rose-400 hover:text-rose-500"
                  style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
                  title="Tout supprimer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mt-3">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher… (expéditeur, objet) — touche /"
                className="w-full rounded-xl border py-2.5 pl-10 pr-9 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10" style={{ color: "var(--text-faint)" }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
              {(["all", "unread", "read", "attachments"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    filter === f ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30" : ""
                  }`}
                  style={filter === f ? undefined : { background: "var(--bg-muted)", color: "var(--text-muted)" }}
                >
                  {f === "all" ? "Tous" : f === "unread" ? "Non lus" : f === "read" ? "Lus" : "📎 Joints"}
                </button>
              ))}
            </div>

            {autoRefresh && (
              <p className="mt-2.5 flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-faint)" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                Actualisation automatique toutes les 4 secondes
              </p>
            )}
          </div>

          {/* Messages */}
          <div className="max-h-[560px] overflow-y-auto p-2.5">
            {refreshing && messages.length === 0 ? (
              <div className="space-y-2 p-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3 rounded-2xl p-3">
                    <div className="skeleton h-10 w-10 !rounded-full" />
                    <div className="flex-1"><div className="skeleton h-4 w-2/3" /><div className="skeleton mt-2 h-3 w-full" /></div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                  <Inbox size={28} />
                </span>
                <p className="mt-4 text-sm font-bold" style={{ color: "var(--text)" }}>
                  {search || filter !== "all" ? "Aucun résultat" : "En attente d'e-mails…"}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>
                  {search || filter !== "all"
                    ? "Essayez un autre mot-clé ou réinitialisez les filtres."
                    : "Les nouveaux messages apparaîtront ici automatiquement. Partagez votre adresse !"}
                </p>
                {(search || filter !== "all") && (
                  <button onClick={() => { setSearch(""); setFilter("all"); }} className="mt-4 flex items-center gap-1.5 rounded-xl bg-indigo-500/10 px-4 py-2 text-xs font-bold text-indigo-500">
                    <RotateCcw size={13} /> Réinitialiser
                  </button>
                )}
                {!search && filter === "all" && (
                  <div className="mt-5 flex items-center gap-2 text-[11px]" style={{ color: "var(--text-faint)" }}>
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                    Écoute en temps réel…
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {messages.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => selectMessage(m.id)}
                    className={`message-row w-full rounded-2xl border border-transparent p-3 text-left ${selectedId === m.id ? "active" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${avatarColor(m.senderName)}`}>
                        {m.senderName.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-bold" style={{ color: "var(--text)" }}>
                            {m.senderName}
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5 text-[11px]" style={{ color: "var(--text-faint)" }}>
                            {m.hasAttachments && <Paperclip size={12} className="text-violet-500" />}
                            {timeAgo(m.receivedAt)}
                          </span>
                        </span>
                        <span className={`mt-0.5 block truncate text-[13px] ${m.isRead ? "" : "font-semibold"}`} style={{ color: m.isRead ? "var(--text-muted)" : "var(--text)" }}>
                          {m.subject}
                        </span>
                        <span className="mt-0.5 block truncate text-xs" style={{ color: "var(--text-faint)" }}>
                          {m.preview}
                        </span>
                        <span className="mt-1.5 flex items-center gap-2">
                          {!m.isRead && (
                            <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              Nouveau
                            </span>
                          )}
                          <span className="truncate text-[11px]" style={{ color: "var(--text-faint)" }}>{m.senderEmail}</span>
                        </span>
                      </span>
                      <ChevronRight size={15} className="mt-1 shrink-0" style={{ color: "var(--text-faint)" }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className={`card min-h-[560px] overflow-hidden rounded-3xl ${mobileView === "list" ? "hidden lg:block" : ""}`}>
          {!selectedMsg ? (
            <div className="flex h-full min-h-[560px] flex-col items-center justify-center px-8 text-center">
              <span className="animate-float-slow grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-indigo-500">
                <MailOpen size={36} />
              </span>
              <p className="mt-5 text-base font-bold" style={{ color: "var(--text)" }}>Sélectionnez un message</p>
              <p className="mt-1 max-w-xs text-[13px] leading-relaxed" style={{ color: "var(--text-faint)" }}>
                Cliquez sur un e-mail dans la liste pour lire son contenu complet, voir les pièces jointes et gérer sa lecture.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2 text-[11px]" style={{ color: "var(--text-faint)" }}>
                {["Aperçu enrichi", "Pièces jointes", "Lu / Non lu"].map((t) => (
                  <span key={t} className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--border)" }}>{t}</span>
                ))}
              </div>
            </div>
          ) : loadingMsg ? (
            <div className="p-8">
              <div className="skeleton h-6 w-1/2" />
              <div className="skeleton mt-4 h-4 w-full" />
              <div className="skeleton mt-2 h-4 w-full" />
              <div className="skeleton mt-2 h-4 w-2/3" />
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* Header */}
              <div className="border-b p-5 sm:p-6" style={{ borderColor: "var(--border)", background: "rgb(99 102 241 / 0.03)" }}>
                <button onClick={() => setMobileView("list")} className="mb-4 flex items-center gap-1 text-sm font-semibold text-indigo-500 lg:hidden">
                  <ChevronLeft size={16} /> Retour à la liste
                </button>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white ${avatarColor(selectedMsg.senderName)}`}>
                      {selectedMsg.senderName.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold" style={{ color: "var(--text)" }}>{selectedMsg.senderName}</p>
                      <p className="truncate text-xs" style={{ color: "var(--text-faint)" }}>{selectedMsg.senderEmail}</p>
                      <p className="mt-1 text-[11px]" style={{ color: "var(--text-faint)" }}>
                        À : {address?.email} • {new Date(selectedMsg.receivedAt).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${selectedMsg.isRead ? "bg-emerald-500/10 text-emerald-500" : "bg-indigo-500 text-white"}`}>
                    {selectedMsg.isRead ? "Lu" : "Non lu"}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-extrabold leading-snug tracking-tight sm:text-xl" style={{ color: "var(--text)" }}>
                  {selectedMsg.subject}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleRead(selectedMsg.id, selectedMsg.isRead)}
                    className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:-translate-y-0.5"
                    style={{ borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    {selectedMsg.isRead ? <EyeOff size={14} /> : <Eye size={14} />}
                    {selectedMsg.isRead ? "Marquer non lu" : "Marquer comme lu"}
                  </button>
                  {selectedMsg.bodyHtml && (
                    <button
                      onClick={() => setShowHtml(!showHtml)}
                      className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:-translate-y-0.5"
                      style={{ borderColor: "var(--border)", color: "var(--text)" }}
                    >
                      <FileText size={14} />
                      {showHtml ? "Voir texte brut" : "Voir version HTML"}
                    </button>
                  )}
                  <button
                    onClick={() => deleteMessage(selectedMsg.id)}
                    className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold text-rose-500 transition hover:-translate-y-0.5 hover:bg-rose-500/10"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <Trash2 size={14} />
                    Supprimer
                  </button>
                  {messages.length > 1 && (
                    <span className="ml-auto flex items-center gap-1">
                      <NavBtn
                        dir={-1}
                        onClick={() => {
                          const idx = messages.findIndex((m) => m.id === selectedMsg.id);
                          const next = messages[idx - 1] ?? messages[messages.length - 1];
                          if (next) selectMessage(next.id);
                        }}
                      />
                      <NavBtn
                        dir={1}
                        onClick={() => {
                          const idx = messages.findIndex((m) => m.id === selectedMsg.id);
                          const next = messages[idx + 1] ?? messages[0];
                          if (next) selectMessage(next.id);
                        }}
                      />
                    </span>
                  )}
                </div>
              </div>

              {/* Attachments */}
              {selectedMsg.hasAttachments && selectedMsg.attachments.length > 0 && (
                <div className="border-b p-5 sm:px-6" style={{ borderColor: "var(--border)" }}>
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
                    <Paperclip size={13} /> {selectedMsg.attachments.length} pièce(s) jointe(s)
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {selectedMsg.attachments.map((a, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-500">
                          <FileText size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold" style={{ color: "var(--text)" }}>{a.filename}</span>
                          <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>{a.size} • {a.mime}</span>
                        </span>
                        <button
                          onClick={() => downloadAttachment(a)}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500 transition hover:bg-indigo-500 hover:text-white"
                          title="Télécharger"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="p-5 sm:p-6">
                {showHtml && sanitizedHtml ? (
                  <div
                    className="overflow-hidden rounded-2xl border bg-white"
                    style={{ borderColor: "var(--border)" }}
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap rounded-2xl border p-5 font-sans text-sm leading-relaxed" style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}>
                    {selectedMsg.bodyText}
                  </pre>
                )}
                <p className="mt-4 flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-faint)" }}>
                  <ShieldCheck size={13} className="text-emerald-500" />
                  Contenu analysé • {(selectedMsg.sizeBytes / 1024).toFixed(1)} Ko • Aucun traqueur externe chargé
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== QR MODAL ===== */}
      {showQR && address && (
        <Modal onClose={() => setShowQR(false)} title="Partager via QR Code">
          <div className="flex flex-col items-center py-2">
            <div className="rounded-3xl bg-white p-6 shadow-inner">
              <QRCode value={address.email} size={200} fgColor="#0f172a" />
            </div>
            <p className="mt-4 rounded-xl px-4 py-2 font-mono text-sm font-bold" style={{ background: "var(--bg-muted)", color: "var(--text)" }}>
              {address.email}
            </p>
            <p className="mt-2 text-center text-xs" style={{ color: "var(--text-faint)" }}>
              Scannez ce code pour copier l&apos;adresse sur mobile
            </p>
            <button onClick={copyAddress} className="btn-primary mt-4 flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold">
              <Copy size={15} /> Copier l&apos;adresse
            </button>
          </div>
        </Modal>
      )}

      {/* ===== NEW ADDRESS MODAL ===== */}
      {showNew && (
        <NewAddressModal
          onClose={() => setShowNew(false)}
          onCreate={createAddress}
          creating={creating}
          domains={domains}
        />
      )}

      {/* ===== DELETE ADDRESS CONFIRM ===== */}
      {showDeleteAddr && (
        <Modal onClose={() => setShowDeleteAddr(false)} title="Supprimer cette adresse ?">
          <div className="flex flex-col items-center py-2 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
              <AlertTriangle size={26} />
            </span>
            <p className="mt-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
              {address?.email}
            </p>
            <p className="mt-1 max-w-xs text-[13px]" style={{ color: "var(--text-muted)" }}>
              Tous les messages ({total}) seront définitivement effacés. Une nouvelle adresse sera créée automatiquement.
            </p>
            <div className="mt-5 flex w-full gap-2">
              <button onClick={() => setShowDeleteAddr(false)} className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                Annuler
              </button>
              <button onClick={deleteAddress} className="flex-1 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:brightness-110">
                Supprimer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ===== CLEAR INBOX CONFIRM ===== */}
      {showClearInbox && (
        <Modal onClose={() => setShowClearInbox(false)} title="Vider la boîte ?">
          <div className="flex flex-col items-center py-2 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Trash2 size={26} />
            </span>
            <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
              Supprimer définitivement les <strong>{total} message(s)</strong> de cette boîte ?
              <br />L&apos;adresse restera active.
            </p>
            <div className="mt-5 flex w-full gap-2">
              <button onClick={() => setShowClearInbox(false)} className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                Annuler
              </button>
              <button onClick={clearInbox} className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:brightness-110">
                Tout supprimer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============ Sub-components ============ */
function NavBtn({ dir, onClick }: { dir: -1 | 1; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg border transition hover:bg-indigo-500/10 hover:text-indigo-500"
      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
    >
      {dir === -1 ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
    </button>
  );
}

export function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="animate-fade-in fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-pop-in w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl"
        style={{ background: "var(--bg-soft)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-[15px] font-bold" style={{ color: "var(--text)" }}>{title}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-black/5 dark:hover:bg-white/10" style={{ color: "var(--text-muted)" }}>
            <X size={17} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function NewAddressModal({ onClose, onCreate, creating, domains }: { onClose: () => void; onCreate: (local?: string, domain?: string) => void; creating: boolean; domains: string[] }) {
  const [local, setLocal] = useState("");
  const [domain, setDomain] = useState<string>(domains[0] ?? FALLBACK_DOMAINS[0]);
  const [custom, setCustom] = useState(false);

  const randomize = () => {
    const adjs = ["swift", "neon", "cosmic", "velvet", "turbo", "lunar", "prime", "hyper"];
    const nouns = ["fox", "falcon", "comet", "spark", "wave", "orbit", "blade", "rocket"];
    setLocal(`${adjs[Math.floor(Math.random() * adjs.length)]}.${nouns[Math.floor(Math.random() * nouns.length)]}.${Math.floor(100 + Math.random() * 9900)}`);
  };

  return (
    <Modal onClose={onClose} title="Nouvelle adresse temporaire">
      <div className="space-y-4">
        <button
          onClick={() => onCreate()}
          disabled={creating}
          className="btn-primary flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left disabled:opacity-60"
        >
          <span>
            <span className="flex items-center gap-2 font-bold"><Zap size={17} /> Génération instantanée</span>
            <span className="mt-0.5 block text-[13px] opacity-85">Adresse aléatoire sécurisée en 1 clic — recommandé</span>
          </span>
          <ArrowRight size={19} />
        </button>

        <div className="flex items-center gap-3 text-xs font-semibold" style={{ color: "var(--text-faint)" }}>
          <span className="h-px flex-1" style={{ background: "var(--border)" }} />
          OU PERSONNALISER
          <span className="h-px flex-1" style={{ background: "var(--border)" }} />
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Choisir mon nom d&apos;adresse</span>
          <button
            onClick={() => setCustom(!custom)}
            className={`relative h-6 w-11 rounded-full transition ${custom ? "bg-indigo-500" : ""}`}
            style={custom ? undefined : { background: "var(--bg-muted)" }}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${custom ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </label>

        {custom && (
          <div className="animate-fade-in space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Nom d&apos;utilisateur</label>
              <div className="flex gap-2">
                <input
                  value={local}
                  onChange={(e) => setLocal(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                  placeholder="ex : marie.dupont.42"
                  className="min-w-0 flex-1 rounded-xl border px-4 py-2.5 font-mono text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
                />
                <button onClick={randomize} className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border transition hover:rotate-90" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }} title="Aléatoire">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Domaine</label>
              <div className="grid grid-cols-2 gap-2">
                {domains.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDomain(d)}
                    className={`rounded-xl border px-3 py-2.5 font-mono text-[13px] transition ${domain === d ? "border-indigo-500 bg-indigo-500/10 text-indigo-500 ring-2 ring-indigo-500/20" : ""}`}
                    style={domain === d ? undefined : { borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    @{d}
                  </button>
                ))}
              </div>
            </div>
            {(local || domain) && (
              <div className="rounded-xl border-2 border-dashed p-3 text-center font-mono text-sm font-bold" style={{ borderColor: "rgb(99 102 241 / 0.4)", color: "var(--text)" }}>
                {local || "votre.nom"}@{domain}
              </div>
            )}
            <button
              onClick={() => onCreate(local || undefined, domain)}
              disabled={creating}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-indigo-500 bg-indigo-500/10 px-4 py-3 text-sm font-bold text-indigo-500 transition hover:bg-indigo-500 hover:text-white disabled:opacity-50"
            >
              <Plus size={16} /> Créer cette adresse
            </button>
          </div>
        )}

        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed" style={{ color: "var(--text-faint)" }}>
          <ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-500" />
          L&apos;ancienne adresse et ses messages seront définitivement supprimés lors de la création.
        </p>
      </div>
    </Modal>
  );
}
