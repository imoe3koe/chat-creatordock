import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        tone === "neutral" && "border-ink-600 bg-ink-700/60 text-content-secondary",
        tone === "accent" && "border-accent/30 bg-accent-muted text-accent-soft",
        tone === "success" && "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
        tone === "warning" && "border-amber-500/25 bg-amber-500/10 text-amber-300",
        tone === "danger" && "border-red-500/25 bg-red-500/10 text-red-300",
        className,
      )}
    >
      {children}
    </span>
  );
}
