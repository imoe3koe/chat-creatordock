import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/lib/supabase/server";
import { getGalleryItems } from "@/modules/gallery/queries";
import { GalleryGrid } from "@/modules/gallery/components/gallery-grid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galeri",
  description: "Galeri foto pribadi kreator CreatorChat.",
  robots: { index: false, follow: false },
};

export default async function GalleryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const items = await getGalleryItems(user.id);

  return <GalleryGrid initialItems={items} me={profile} />;
}
