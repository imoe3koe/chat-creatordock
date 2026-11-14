import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";
import { SettingsView } from "@/modules/settings/components/settings-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengaturan",
  description: "Kelola profil, email, dan keamanan akun CreatorChat.",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <SettingsView
      profile={profile}
      email={user.email ?? ""}
      createdAt={user.created_at}
      lastSignIn={user.last_sign_in_at}
    />
  );
}
