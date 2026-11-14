import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSavedArticles } from "@/modules/articles/queries";
import { ArticleLibrary } from "@/modules/articles/components/article-library";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Artikel",
  description: "Pustaka artikel pribadi kreator CreatorChat.",
  robots: { index: false, follow: false },
};

export default async function ArticlesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const articles = await getSavedArticles(user.id);

  return <ArticleLibrary initialArticles={articles} />;
}
