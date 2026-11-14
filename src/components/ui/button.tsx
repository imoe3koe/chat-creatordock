import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-ink-950 font-semibold hover:bg-accent-hover active:bg-accent-hover shadow-[0_4px_16px_rgba(255,107,0,0.18)]",
  secondary:
    "bg-ink-700 text-content-primary hover:bg-ink-600 border border-ink-600",
  ghost:
    "bg-transparent text-content-secondary hover:bg-white/[0.06] hover:text-content-primary",
  outline:
    "border border-ink-600 bg-transparent text-content-primary hover:border-accent/60 hover:bg-accent-muted",
  danger:
    "bg-red-600/90 text-white hover:bg-red-500",
};

const sizes: Record<Size, string> = {
  sm: "h-9 min-h-9 px-3 text-xs rounded-lg gap-1.5",
  md: "h-11 min-h-11 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 min-h-12 px-6 text-sm rounded-xl gap-2",
  icon: "size-11 min-h-11 min-w-11 rounded-xl",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, disabled, children, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "focus-ring inline-flex select-none items-center justify-center whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export const buttonStyles = (variant: Variant = "primary", size: Size = "md") =>
  cn(
    "focus-ring inline-flex select-none items-center justify-center whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
  );
