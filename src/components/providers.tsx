"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";

/* ================= THEME ================= */
type Theme = "light" | "dark";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void; mounted: boolean }>({
  theme: "light",
  toggle: () => {},
  mounted: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tempmail-theme") as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    // Initialisation depuis les APIs navigateur : légitime dans un effet de montage
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("tempmail-theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  return <ThemeCtx.Provider value={{ theme, toggle, mounted }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

/* ================= TOAST ================= */
type ToastKind = "success" | "info" | "warning" | "error";

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

const ToastCtx = createContext<{ notify: (kind: ToastKind, title: string, message?: string) => void }>({
  notify: () => {},
});

export const useToast = () => useContext(ToastCtx);

const ICONS: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const COLORS: Record<ToastKind, string> = {
  success: "text-emerald-500",
  info: "text-indigo-500",
  warning: "text-amber-500",
  error: "text-rose-500",
};

const BARS: Record<ToastKind, string> = {
  success: "bg-emerald-500",
  info: "bg-indigo-500",
  warning: "bg-amber-500",
  error: "bg-rose-500",
};

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((kind: ToastKind, title: string, message?: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-3), { id, kind, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastCtx.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:bottom-6 sm:right-6">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              className="animate-toast-in pointer-events-auto relative overflow-hidden rounded-2xl border p-4 pr-10 backdrop-blur-xl toast-shadow"
              style={{ background: "var(--glass)", borderColor: "var(--border)" }}
            >
              <div className={`absolute left-0 top-0 h-full w-1 ${BARS[t.kind]}`} />
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 shrink-0 ${COLORS[t.kind]}`}>
                  <Icon size={20} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text)" }}>
                    {t.title}
                  </p>
                  {t.message && (
                    <p className="mt-1 text-[13px] leading-snug" style={{ color: "var(--text-muted)" }}>
                      {t.message}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="absolute right-2 top-2 rounded-lg p-1.5 transition hover:bg-black/5 dark:hover:bg-white/10"
                style={{ color: "var(--text-faint)" }}
                aria-label="Fermer"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
