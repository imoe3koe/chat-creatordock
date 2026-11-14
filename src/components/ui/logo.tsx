import Link from "next/link";
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/icon.svg"
        alt="Logo CreatorChat"
        className="size-9 rounded-xl object-contain shadow-[0_4px_20px_rgba(255,107,0,0.25)]"
      />
      {!compact ? (
        <span className="text-[17px] font-bold tracking-tight text-content-primary">
          Creator<span className="text-accent">Chat</span>
        </span>
      ) : null}
    </Link>
  );
}
