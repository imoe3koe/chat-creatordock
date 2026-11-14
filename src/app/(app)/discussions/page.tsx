import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";
import {
  getDiscussions,
  getPendingApprovals,
} from "@/modules/discussions/queries";
import { DiscussionsHub } from "@/modules/discussions/components/discussions-hub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Diskusi",
  description: "Ruang diskusi privat dengan sistem undangan dan persetujuan.",
  robots: { index: false, follow: false },
};

export default async function DiscussionsPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string; tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const params = await searchParams;
  const [discussions, pendingApprovals] = await Promise.all([
    getDiscussions(),
    getPendingApprovals(user.id),
  ]);

  return (
    <DiscussionsHub
      discussions={discussions}
      pendingApprovals={pendingApprovals}
      me={profile}
      initialCreateOpen={params.create === "1"}
      initialTab={params.tab === "approvals" ? "approvals" : "rooms"}
    />
  );
}
