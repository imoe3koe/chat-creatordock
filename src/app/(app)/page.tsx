import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";
import { getFeedPosts, getSavedPostIds } from "@/modules/feed/queries";
import { Feed } from "@/modules/feed/components/feed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Beranda",
  description: "Obrolan realtime komunitas kreator CreatorChat.",
};

function greeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 17) return "Selamat sore";
  return "Selamat malam";
}


export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [posts, savedIds] = await Promise.all([
    getFeedPosts(30),
    getSavedPostIds(user.id),
  ]);

  const firstName = profile.full_name?.split(" ")[0] || profile.username;

  return (
    <div className="space-y-4">
      <header className="px-1 pt-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
          {greeting()}, {firstName}
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            <MessageSquareText className="size-5 text-accent" aria-hidden />
            Ruang Obrolan
          </h1>
          <p className="text-[11px] text-content-muted">
            {posts.length > 0
              ? `${posts.length} percakapan terbaru`
              : "Mulai percakapan pertama"}
          </p>
        </div>
        <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-content-secondary sm:text-[13px]">
          Tempat santai untuk berbagi progres, tautan, foto, dan dokumen. Semua
          yang kamu simpan bisa dibaca lagi di Pustaka Artikel.
        </p>
      </header>

      <Feed initialPosts={posts} initialSavedIds={savedIds} me={profile} />
    </div>
  );
}
