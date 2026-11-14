import { getWordPressPageLinks } from "@/lib/wordpress/client";
import { PublicHeader } from "@/modules/wordpress/components/public-header";
import { PublicFooter } from "@/modules/wordpress/components/public-footer";

export const revalidate = 300;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pages = await getWordPressPageLinks();

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader pages={pages} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <PublicFooter pages={pages} />
    </div>
  );
}
