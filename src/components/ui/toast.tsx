"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";
type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      setToasts((current) => [...current.slice(-3), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message) => toast(message, "success"),
      error: (message) => toast(message, "error"),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-3 top-3 z-[120] flex flex-col items-center gap-2 sm:left-auto sm:right-4 sm:top-4 sm:items-end"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((item) => {
          const Icon =
            item.tone === "success"
              ? CheckCircle2
              : item.tone === "error"
                ? AlertTriangle
                : Info;
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3.5 text-sm shadow-2xl animate-fade-up",
                item.tone === "success" && "border-emerald-500/30 bg-emerald-950/95 text-emerald-100",
                item.tone === "error" && "border-red-500/30 bg-red-950/95 text-red-100",
                item.tone === "info" && "border-ink-600 bg-ink-800/95 text-content-primary",
              )}
            >
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p className="flex-1 leading-snug">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="tap-target -m-2 grid size-9 place-items-center rounded-md text-current/70 transition hover:bg-white/10"
                aria-label="Tutup notifikasi"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>.");
  }
  return context;
}
