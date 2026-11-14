"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Clock,
  Crown,
  MessagesSquare,
  Plus,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { checkClientRateLimit } from "@/lib/security/rate-limit";
import { extractMentions, sanitizeUsername } from "@/lib/security/sanitize";
import type { Profile } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import { createDiscussion, setMemberStatus, type CreateDiscussionResult } from "../api";
import type { DiscussionWithMembers, PendingApproval } from "../queries";
import { InviteMembersModal } from "./invite-members-modal";

function memberName(member: {
  profile?: { full_name?: string | null; username?: string | null } | null;
}) {
  return member.profile?.full_name || member.profile?.username || "Kreator";
}

export function DiscussionsHub({
  discussions,
  pendingApprovals,
  me,
  initialCreateOpen = false,
  initialTab = "rooms",
}: {
  discussions: DiscussionWithMembers[];
  pendingApprovals: PendingApproval[];
  me: Profile;
  initialCreateOpen?: boolean;
  initialTab?: "rooms" | "approvals";
}) {
  const router = useRouter();
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(initialCreateOpen);
  const [tab, setTab] = useState<"rooms" | "approvals">(initialTab);
  const [approvals, setApprovals] = useState(pendingApprovals);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [invites, setInvites] = useState("");
  const [creating, setCreating] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<DiscussionWithMembers | null>(null);

  async function approve(row: PendingApproval, status: "approved" | "rejected") {
    const key = `${row.discussion_id}:${row.user_id}`;
    setBusyKey(key);
    const result = await setMemberStatus(row.discussion_id, row.user_id, status);
    setBusyKey(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setApprovals((current) => current.filter((item) => `${item.discussion_id}:${item.user_id}` !== key));
    toast.success(result.message ?? "Status diperbarui.");
    router.refresh();
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Judul diskusi wajib diisi.");
      return;
    }

    const limit = checkClientRateLimit("discussions:create", {
      limit: 3,
      windowMs: 120_000,
    });
    if (!limit.allowed) {
      toast.error("Terlalu banyak ruang baru. Tunggu sebentar.");
      return;
    }

    const usernames = Array.from(
      new Set([
        ...extractMentions(invites),
        ...invites
          .split(/[\s,;]+/)
          .map((value) => sanitizeUsername(value))
          .filter((value) => value.length >= 3),
      ]),
    );

    setCreating(true);
    const result = await createDiscussion(me.id, {
      title,
      description,
      usernames,
    });
    setCreating(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    const data = result.data as CreateDiscussionResult;
    if (data.unknown.length > 0) {
      toast.toast(
        `Username tidak ditemukan: ${data.unknown.map((name) => `@${name}`).join(", ")}`,
      );
    }
    toast.success(
      data.invited.length > 0
        ? `Ruang dibuat. ${data.invited.length} undangan menunggu persetujuanmu.`
        : "Ruang diskusi dibuat.",
    );
    setCreateOpen(false);
    setTitle("");
    setDescription("");
    setInvites("");
    router.push(`/discussions/${data.discussionId}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            Ruang privat
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            <MessagesSquare className="size-5 text-accent" aria-hidden />
            Ruang Diskusi
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-content-secondary">
            Buat ruang obrolan bersama kreator pilihan. Undang lewat{" "}
            <span className="text-accent-soft">@username</span>, lalu setujui
            setiap anggota sebelum mereka masuk.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Buat diskusi
        </Button>
      </header>

      <div className="flex items-center gap-1 rounded-xl border border-ink-600 bg-ink-800 p-1">
        <button
          type="button"
          onClick={() => setTab("rooms")}
          className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg text-xs font-medium transition ${
            tab === "rooms" ? "bg-ink-700 text-content-primary" : "text-content-muted hover:text-content-secondary"
          }`}
        >
          <MessagesSquare className="size-3.5" aria-hidden />
          Diskusi saya
          <span className="text-[10px] text-content-muted">({discussions.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("approvals")}
          className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg text-xs font-medium transition ${
            tab === "approvals" ? "bg-ink-700 text-content-primary" : "text-content-muted hover:text-content-secondary"
          }`}
        >
          <ShieldCheck className="size-3.5" aria-hidden />
          Persetujuan
          {approvals.length > 0 ? (
            <span className="grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-ink-950">
              {approvals.length}
            </span>
          ) : null}
        </button>
      </div>

      {tab === "approvals" ? (
        <section className="space-y-2">
          {approvals.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Tidak ada permintaan tertunda"
              description="Undangan yang kamu kirim akan muncul di sini sampai kamu setujui atau tolak."
            />
          ) : (
            approvals.map((row) => {
              const key = `${row.discussion_id}:${row.user_id}`;
              return (
                <div
                  key={key}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink-600 bg-ink-800 p-3.5"
                >
                  <Avatar
                    src={row.profile?.avatar_url}
                    name={memberName(row)}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content-primary">
                      {memberName(row)}
                    </p>
                    <p className="truncate text-[11px] text-content-muted">
                      ingin bergabung di{" "}
                      <span className="text-content-secondary">{row.discussion?.title}</span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-content-muted">
                      <Clock className="size-2.5" aria-hidden />
                      Diundang {formatRelativeTime(row.created_at)}
                    </p>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void approve(row, "rejected")}
                      loading={busyKey === key}
                      className="flex-1 sm:flex-none"
                    >
                      <X className="size-3.5" aria-hidden /> Tolak
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void approve(row, "approved")}
                      loading={busyKey === key}
                      className="flex-1 sm:flex-none"
                    >
                      <Check className="size-3.5" aria-hidden /> Setujui
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      ) : discussions.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="Belum ada ruang diskusi"
          description="Buat ruang privat untuk proyek kolaborasi, komunitas, atau sekadar ngobrol dengan kreator favoritmu."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Buat ruang pertama
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {discussions.map((discussion) => {
            const members = discussion.discussion_members ?? [];
            const approved = members.filter((member) => member.status === "approved");
            const pending = members.filter((member) => member.status === "pending");
            const isOwner = discussion.owner_id === me.id;
            return (
              <div
                key={discussion.id}
                className="group relative overflow-hidden rounded-2xl border border-ink-600 bg-ink-800 transition hover:border-accent/35"
              >
                <Link
                  href={`/discussions/${discussion.id}`}
                  className="flex items-start gap-3 p-4"
                  aria-label={`Buka diskusi ${discussion.title}`}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink-700 text-accent">
                    <MessagesSquare className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="line-clamp-1 text-sm font-semibold text-content-primary">
                        {discussion.title}
                      </span>
                      {isOwner ? (
                        <Badge tone="accent">
                          <Crown className="size-2.5" aria-hidden /> Pemilik
                        </Badge>
                      ) : null}
                      {isOwner && pending.length > 0 ? (
                        <Badge tone="warning">{pending.length} menunggu</Badge>
                      ) : null}
                    </span>
                    {discussion.description ? (
                      <span className="mt-1 line-clamp-2 block text-[11px] leading-relaxed text-content-secondary">
                        {discussion.description}
                      </span>
                    ) : null}
                    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-content-muted">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" aria-hidden />
                        {approved.length} anggota
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" aria-hidden />
                        {formatRelativeTime(discussion.updated_at)}
                      </span>
                      {discussion.owner?.username ? (
                        <span>oleh @{discussion.owner.username}</span>
                      ) : null}
                    </span>
                    <span className="mt-2 flex -space-x-1.5">
                      {approved.slice(0, 5).map((member) => (
                        <Avatar
                          key={member.user_id}
                          src={member.profile?.avatar_url}
                          name={memberName(member)}
                          size="xs"
                          className="ring-2 ring-ink-800"
                        />
                      ))}
                      {isOwner && pending.length > 0 ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            setInviteTarget(discussion);
                          }}
                          className="relative z-10 grid size-7 place-items-center rounded-full border-2 border-ink-800 bg-accent text-ink-950"
                          aria-label="Kelola anggota"
                        >
                          <UserPlus className="size-3" />
                        </button>
                      ) : null}
                    </span>
                  </span>
                  <ChevronRight className="mt-3 size-4 shrink-0 text-content-muted transition group-hover:text-accent" aria-hidden />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => (creating ? null : setCreateOpen(false))}
        title="Buat ruang diskusi"
        description="Ruang hanya dapat diakses oleh anggota yang kamu setujui."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>
              Batal
            </Button>
            <Button type="submit" form="discussion-form" loading={creating}>
              <Plus className="size-4" aria-hidden />
              Buat ruang
            </Button>
          </>
        }
      >
        <form id="discussion-form" onSubmit={create} className="space-y-4">
          <Field label="Nama ruang" htmlFor="discussion-title">
            <Input
              id="discussion-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Kolaborasi zine edisi kedua"
              maxLength={120}
              required
            />
          </Field>
          <Field label="Deskripsi" htmlFor="discussion-description" hint="Opsional">
            <Textarea
              id="discussion-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Tujuan ruang, aturan singkat, atau agenda diskusi."
              maxLength={500}
              className="min-h-24"
            />
          </Field>
          <Field
            label="Undang anggota"
            htmlFor="discussion-invites"
            hint="Pisahkan dengan spasi/koma"
          >
            <Input
              id="discussion-invites"
              value={invites}
              onChange={(event) => setInvites(event.target.value)}
              placeholder="@budi @sari, @dian"
              maxLength={400}
            />
          </Field>
          <div className="flex items-start gap-2 rounded-xl border border-ink-600 bg-ink-900/70 p-3 text-[11px] leading-relaxed text-content-muted">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
            Setiap undangan berstatus menunggu. Kamu dapat menyetujui atau menolak
            dari tab Persetujuan maupun di dalam ruang diskusi.
          </div>
        </form>
      </Modal>

      <InviteMembersModal
        open={Boolean(inviteTarget)}
        onClose={() => {
          setInviteTarget(null);
          router.refresh();
        }}
        discussion={inviteTarget}
        ownerId={me.id}
      />
    </div>
  );
}
