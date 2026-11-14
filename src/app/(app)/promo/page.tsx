import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";
import { getPromos } from "@/modules/promo/queries";
import { PromoShowcase } from "@/modules/promo/components/promo-showcase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promo",
  description: "Etalase promo, jasa, dan karya kreator CreatorChat.",
  robots: { index: false, follow: false },
};

export default async function PromoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const promos = await getPromos();

  return <PromoShowcase initialPromos={promos} me={profile} />;
}
