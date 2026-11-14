import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, ShieldCheck, XCircle } from "lucide-react";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  getDiscussion,
  getDiscussionMessages,
  getMembershipStatus,
} from "@/modules/discussions/queries";
import { DiscussionRoom } from "@/modules/discussions/components/discussion-room";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ruang Diskusi",
  description: "Obrolan realtime anggota CreatorChat.",
  robots: { index: false, follow: false },
};

function StatusScreen({
  tone,
  title,
  description,
}: {
  tone: "pending" | "rejected";
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center rounded-2xl border border-ink-600 bg-ink-800 px-6 py-12 text-center">
      <span
        className={`grid size-14 place-items-center rounded-2xl border ${
          tone === "pending"
            ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
            : "border-red-500/25 bg-red-500/10 text-red-300"
        }`}
      >
        {tone === "pending" ? (
          <Clock className="size-6" aria-hidden />
        ) : (
          <XCircle className="size-6" aria-hidden />
        )}
      </span>
      <h1 className="mt-4 text-lg font-semibold text-content-primary">{title}</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-content-secondary">
        {description}
      </p>
      <Link href="/discussions" className="mt-6">
        <Button variant="secondary">
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke daftar diskusi
        </Button>
      </Link>
    </div>
  );
}

export default async function DiscussionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { id } = await params;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) notFound();

  const discussion = await getDiscussion(id);

  if (!discussion) {
    const status = await getMembershipStatus(id, user.id);
    if (status === "pending") {
      return (
        <StatusScreen
          tone="pending"
          title="Menunggu persetujuan"
          description="Undanganmu sudah diterima sistem. Pemilik ruang perlu menyetujui sebelum kamu bisa membaca dan mengirim pesan."
        />
      );
    }
    if (status === "rejected") {
      return (
        <StatusScreen
          tone="rejected"
          title="Undangan tidak disetujui"
          description="Pemilik ruang belum mengizinkanmu bergabung. Hubungi pemilik jika menurutmu ini sebuah kekeliruan."
        />
      );
    }
    notFound();
  }

  const isOwner = discussion.owner_id === user.id;
  const membership = discussion.discussion_members?.find(
    (member) => member.user_id === user.id,
  );

  if (!isOwner && membership?.status !== "approved") {
    return (
      <StatusScreen
        tone={membership?.status === "rejected" ? "rejected" : "pending"}
        title={
          membership?.status === "rejected"
            ? "Undangan tidak disetujui"
            : "Menunggu persetujuan"
        }
        description="Akses ruang ini hanya tersedia setelah pemilik menyetujui keanggotaanmu."
      />
    );
  }

  const messages = await getDiscussionMessages(id);

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 px-1 text-[10px] text-content-muted">
        <ShieldCheck className="size-3 text-accent" aria-hidden />
        Ruang privat terenkripsi transport · hanya anggota terverifikasi
      </p>
      <DiscussionRoom
        discussion={discussion}
        initialMessages={messages}
        me={profile}
        isOwner={isOwner}
      />
    </div>
  );
}
