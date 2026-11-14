import { sanitizeRichHtml } from "@/lib/security/sanitize";
import { cn } from "@/lib/utils";

/**
 * Render CMS HTML only after sanitising it. WordPress content is treated as
 * untrusted input: scripts, event handlers, iframes, forms, and inline styles
 * are stripped before the markup reaches the DOM.
 */
export function WordPressContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const safeHtml = sanitizeRichHtml(html);
  if (!safeHtml) return null;

  return (
    <div
      className={cn("prose-creatorchat", className)}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
