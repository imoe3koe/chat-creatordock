import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const inputClassName =
  "w-full rounded-xl border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-content-primary placeholder:text-content-muted transition focus:border-accent/70 focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputClassName, "h-11 min-h-11", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(inputClassName, "min-h-[100px] resize-y leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-content-secondary"
      >
        <span>{label}</span>
        {hint ? <span className="normal-case tracking-normal text-content-muted">{hint}</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
