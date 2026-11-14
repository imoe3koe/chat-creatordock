import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("focus-ring inline-flex items-center gap-2.5 rounded-lg", className)}
      aria-label="CreatorChat — Beranda"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-accent text-ink-950 shadow-[0_4px_20px_rgba(255,107,0,0.25)]">
        <MessageSquareText className="size-5" strokeWidth={2.4} aria-hidden />
      </span>
      {!compact ? (
        <span className="text-[17px] font-bold tracking-tight text-content-primary">
          Creator<span className="text-accent">Chat</span>
        </span>
      ) : null}
    </Link>
  );
}
