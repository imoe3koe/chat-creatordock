import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-600 bg-ink-850/50 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-4 grid size-12 place-items-center rounded-2xl border border-ink-600 bg-ink-800 text-accent">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="text-sm font-semibold text-content-primary">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-content-secondary">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
