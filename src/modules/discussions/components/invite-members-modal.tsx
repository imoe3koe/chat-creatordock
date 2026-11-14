"use client";

import { useState } from "react";
import { Check, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { checkClientRateLimit } from "@/lib/security/rate-limit";
import { extractMentions } from "@/lib/security/sanitize";
import type { Discussion } from "@/lib/types";
import { inviteMembers } from "../api";

export function InviteMembersModal({
  open,
  onClose,
  discussion,
  ownerId,
  onInvited,
}: {
  open: boolean;
  onClose: () => void;
  discussion: Discussion | null;
  ownerId: string;
  onInvited?: () => void;
}) {
  const toast = useToast();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!discussion) return;

    const mentions = extractMentions(value);
    const manual = value
      .split(/[\s,;]+/)
      .map((entry) => entry.replace(/^@/, "").toLowerCase())
      .filter((entry) => /^[a-z0-9_]{3,30}$/.test(entry));
    const usernames = Array.from(new Set([...mentions, ...manual]));

    if (usernames.length === 0) {
      toast.error("Tulis minimal satu @username yang valid.");
      return;
    }

    const limit = checkClientRateLimit("discussions:invite", {
      limit: 6,
      windowMs: 60_000,
    });
    if (!limit.allowed) {
      toast.error("Terlalu banyak undangan. Tunggu sebentar.");
      return;
    }

    setLoading(true);
    const result = await inviteMembers(discussion.id, ownerId, usernames);
    setLoading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    const unknown = result.data?.unknown ?? [];
    if (unknown.length > 0) {
      toast.toast(`Tidak ditemukan: ${unknown.map((name) => `@${name}`).join(", ")}`);
    }
    toast.success(result.message ?? "Undangan dikirim.");
    setValue("");
    onInvited?.();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Undang anggota"
      description={discussion ? `Tambahkan kreator ke “${discussion.title}”.` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" form="invite-form" loading={loading}>
            <UserPlus className="size-4" aria-hidden />
            Kirim undangan
          </Button>
        </>
      }
    >
      <form id="invite-form" onSubmit={submit} className="space-y-4">
        <Field
          label="Username kreator"
          htmlFor="invite-usernames"
          hint="Bisa lebih dari satu"
        >
          <Input
            id="invite-usernames"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="@budi @sari"
            maxLength={400}
            autoFocus
          />
        </Field>

        <div className="rounded-xl border border-ink-600 bg-ink-900/70 p-3 text-[11px] leading-relaxed text-content-muted">
          <p className="font-medium text-content-secondary">Cara kerja persetujuan</p>
          <ul className="mt-1.5 space-y-1">
            <li className="flex gap-1.5">
              <Check className="mt-0.5 size-3 shrink-0 text-emerald-400" aria-hidden />
              Undangan masuk sebagai <span className="text-content-secondary">menunggu</span>.
            </li>
            <li className="flex gap-1.5">
              <Check className="mt-0.5 size-3 shrink-0 text-emerald-400" aria-hidden />
              Kamu menyetujui lewat tab Persetujuan atau panel anggota.
            </li>
            <li className="flex gap-1.5">
              <X className="mt-0.5 size-3 shrink-0 text-content-muted" aria-hidden />
              Anggota baru bisa membaca & mengirim pesan setelah disetujui.
            </li>
          </ul>
        </div>
      </form>
    </Modal>
  );
}
