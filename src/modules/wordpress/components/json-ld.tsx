/**
 * Serialise structured data for a <script type="application/ld+json"> tag.
 * Escaping "<" prevents an accidental "</script>" sequence inside JSON.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
