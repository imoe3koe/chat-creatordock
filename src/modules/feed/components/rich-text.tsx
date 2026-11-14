import { sanitizeHttpUrl, hasUnsafeProtocol } from "@/lib/security/sanitize";

const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;
const MENTION_REGEX = /(^|[\s(])@([a-zA-Z0-9_]{3,30})\b/g;

function renderMentions(
  text: string,
  keyPrefix: string,
  mentionClassName: string,
) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  MENTION_REGEX.lastIndex = 0;

  while ((match = MENTION_REGEX.exec(text)) !== null) {
    const [full, prefix, username] = match;
    const start = match.index + prefix.length;
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    parts.push(
      <span
        key={`${keyPrefix}-mention-${start}`}
        className={mentionClassName}
      >
        @{username}
      </span>,
    );
    lastIndex = start + full.length - prefix.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function RichText({
  content,
  className,
  mentionClassName = "font-medium text-accent-soft",
  linkClassName = "break-all text-accent hover:underline",
}: {
  content: string;
  className?: string;
  mentionClassName?: string;
  linkClassName?: string;
}) {
  if (!content) return null;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(content)) !== null) {
    const rawUrl = match[0];
    const start = match.index;
    const trailing = rawUrl.match(/[).,!?;:]+$/)?.[0] ?? "";
    const cleanUrl = trailing ? rawUrl.slice(0, -trailing.length) : rawUrl;

    if (start > lastIndex) {
      nodes.push(
        <span key={`text-${lastIndex}`}>
          {renderMentions(
            content.slice(lastIndex, start),
            `t-${lastIndex}`,
            mentionClassName,
          )}
        </span>,
      );
    }

    const href = hasUnsafeProtocol(cleanUrl) ? null : sanitizeHttpUrl(cleanUrl);
    if (href) {
      nodes.push(
        <a
          key={`url-${start}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={linkClassName}
        >
          {cleanUrl.replace(/^https?:\/\//, "").slice(0, 70)}
          {cleanUrl.replace(/^https?:\/\//, "").length > 70 ? "…" : ""}
        </a>,
      );
    } else {
      nodes.push(cleanUrl);
    }

    if (trailing) nodes.push(trailing);
    lastIndex = start + rawUrl.length;
  }

  if (lastIndex < content.length) {
    nodes.push(
      <span key={`text-${lastIndex}`}>
        {renderMentions(
          content.slice(lastIndex),
          `t-${lastIndex}`,
          mentionClassName,
        )}
      </span>,
    );
  }

  return (
    <p
      className={
        className ??
        "whitespace-pre-wrap break-words text-[14px] leading-relaxed text-content-primary sm:text-[15px]"
      }
    >
      {nodes.length > 0 ? nodes : content}
    </p>
  );
}
