/* eslint-disable @next/next/no-img-element */
import { cn, getInitials } from "@/lib/utils";

type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  ring?: boolean;
  online?: boolean;
};

const sizeClasses = {
  xs: "size-7 text-[10px]",
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
  "2xl": "size-24 text-2xl",
};

export function Avatar({
  src,
  name,
  size = "md",
  className,
  ring,
  online,
}: AvatarProps) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "grid place-items-center overflow-hidden rounded-full bg-gradient-to-br from-accent/80 to-accent-hover font-semibold text-ink-950",
          sizeClasses[size],
          ring && "ring-2 ring-ink-950 ring-offset-2 ring-offset-accent",
        )}
      >
        {src ? (
          <img
            src={src}
            alt={name ? `Foto profil ${name}` : "Foto profil"}
            className="size-full object-cover"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span aria-hidden>{getInitials(name)}</span>
        )}
      </span>
      {online ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-ink-800 bg-emerald-400"
          aria-label="Online"
        />
      ) : null}
    </span>
  );
}
