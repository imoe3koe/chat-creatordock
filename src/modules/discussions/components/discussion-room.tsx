"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Crown,
  Lock,
  LogOut,
  MessagesSquare,
  Send,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { DISCUSSION_MESSAGE_MAX_LENGTH } from "@/lib/constants";
import { checkClientRateLimit } from "@/lib/security/rate-limit";
import type {
  DiscussionMember,
  DiscussionMessage,
  Profile,
} from "@/lib/types";
import { RichText } from "@/modules/feed/components/rich-text";
import {
  deleteDiscussion,
  fetchDiscussionMessages,
  leaveDiscussion,
  removeMember,
  sendDiscussionMessage,
  setMemberStatus,
} from "../api";
import type { DiscussionWithMembers } from "../queries";
import { InviteMembersModal } from "./invite-members-modal";

function memberName(member: { profile?: Profile | null }) {
  return member.profile?.full_name || member.profile?.username || "Kreator";
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function dedupeMessages(messages: DiscussionMessage[]) {
  const map = new Map<string, DiscussionMessage>();
  messages.forEach((message) => map.set(message.id, message));
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

export function DiscussionRoom({
  discussion,
  initialMessages,
  me,
  isOwner,
}: {
  discussion: DiscussionWithMembers;
  initialMessages: DiscussionMessage[];
  me: Profile;
  isOwner: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [messages, setMessages] = useState(() => dedupeMessages(initialMessages));
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const refreshTimer = useRef<number | null>(null);

  const [members, setMembers] = useState<DiscussionMember[]>(() => {
    const current = discussion.discussion_members ?? [];
    if (
      discussion.owner &&
      !current.some((member) => member.user_id === discussion.owner_id)
    ) {
      return [
        {
          discussion_id: discussion.id,
          user_id: discussion.owner_id,
          role: "owner",
          status: "approved",
          invited_by: null,
          created_at: discussion.created_at,
          profile: discussion.owner,
        },
        ...current,
      ];
    }
    return current;
  });

  useEffect(() => {
    setMembers(discussion.discussion_members ?? []);
  }, [discussion.discussion_members]);

  const approvedMembers = useMemo(
    () => members.filter((member) => member.status === "approved"),
    [members],
  );
  const pendingMembers = useMemo(
    () => members.filter((member) => member.status === "pending"),
    [members],
  );

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const query = mentionQuery.toLowerCase();
    return approvedMembers
      .filter(
        (member) =>
          member.user_id !== me.id &&
          member.profile?.username &&
          member.profile.username.startsWith(query),
      )
      .slice(0, 5);
  }, [approvedMembers, mentionQuery, me.id]);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchDiscussionMessages(discussion.id);
      setMessages(dedupeMessages(data));
    } catch {
      // Realtime will retry on the next event.
    }
  }, [discussion.id]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => {
      void refresh();
    }, 350);
  }, [refresh]);

  useEffect(() => {
    let supabase;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel(`creatorchat:discussion:${discussion.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "discussion_messages",
          filter: `discussion_id=eq.${discussion.id}`,
        },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [discussion.id, scheduleRefresh]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }, [messages.length, membersOpen]);

  function handleDraftChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    setDraft(value);

    const cursor = event.target.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const mention = before.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
    setMentionQuery(mention ? mention[1] : null);

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }

  function insertMention(username: string) {
    const textarea = textareaRef.current;
    const cursor = textarea?.selectionStart ?? draft.length;
    const before = draft.slice(0, cursor);
    const after = draft.slice(cursor);
    const replaced = before.replace(/@([a-zA-Z0-9_]*)$/, `@${username} `);
    setDraft(replaced + after);
    setMentionQuery(null);
    window.setTimeout(() => {
      textarea?.focus();
      const position = replaced.length;
      textarea?.setSelectionRange(position, position);
    }, 10);
  }

  async function send(event?: React.FormEvent) {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    const limit = checkClientRateLimit(`discussion:${discussion.id}:send`, {
      limit: 20,
      windowMs: 60_000,
    });
    if (!limit.allowed) {
      toast.error("Kamu mengirim terlalu cepat. Tunggu sebentar.");
      return;
    }

    setSending(true);
    setMentionQuery(null);
    const result = await sendDiscussionMessage(discussion.id, me.id, content);
    setSending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (result.data) {
      setMessages((current) => dedupeMessages([...current, result.data as DiscussionMessage]));
    }
    setDraft("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    window.setTimeout(() => {
      const element = scrollRef.current;
      if (element) element.scrollTop = element.scrollHeight;
    }, 50);
  }

  async function updateStatus(member: DiscussionMember, status: "approved" | "rejected") {
    const key = `${member.discussion_id}:${member.user_id}`;
    setBusyKey(key);
    const result = await setMemberStatus(discussion.id, member.user_id, status);
    setBusyKey(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setMembers((current) =>
      current.map((item) =>
        item.user_id === member.user_id ? { ...item, status } : item,
      ),
    );
    toast.success(result.message ?? "Status diperbarui.");
  }

  async function kick(member: DiscussionMember) {
    if (!window.confirm(`Keluarkan ${memberName(member)} dari diskusi?`)) return;
    const key = `${member.discussion_id}:${member.user_id}`;
    setBusyKey(key);
    const result = await removeMember(discussion.id, member.user_id);
    setBusyKey(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setMembers((current) => current.filter((item) => item.user_id !== member.user_id));
    toast.success(result.message ?? "Anggota dikeluarkan.");
  }

  async function leave() {
    if (!window.confirm("Keluar dari ruang diskusi ini?")) return;
    const result = await leaveDiscussion(discussion.id, me.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Kamu keluar dari diskusi.");
    router.push("/discussions");
    router.refresh();
  }

  async function destroy() {
    if (
      !window.confirm(
        "Hapus ruang diskusi beserta seluruh pesannya? Tindakan ini permanen.",
      )
    ) {
      return;
    }
    const result = await deleteDiscussion(discussion.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Diskusi dihapus.");
    router.push("/discussions");
    router.refresh();
  }

  let lastDate = "";

  return (
    <div className="flex h-[calc(100dvh-10.25rem)] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-ink-600 bg-ink-800 shadow-card lg:h-[calc(100dvh-3rem)]">
      <header className="shrink-0 border-b border-ink-600 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <Link
            href="/discussions"
            className="tap-target grid size-9 shrink-0 place-items-center rounded-lg text-content-secondary transition hover:bg-white/[0.06] hover:text-content-primary"
            aria-label="Kembali ke daftar diskusi"
          >
            <ArrowLeft className="size-4.5" />
          </Link>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink-700 text-accent">
            <MessagesSquare className="size-4.5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-sm font-semibold text-content-primary">
                {discussion.title}
              </h1>
              <Lock className="size-3 shrink-0 text-content-muted" aria-label="Ruang privat" />
            </div>
            <button
              type="button"
              onClick={() => setMembersOpen((value) => !value)}
              className="flex items-center gap-1 text-[10px] text-content-muted transition hover:text-content-secondary"
              aria-expanded={membersOpen}
            >
              <Users className="size-3" aria-hidden />
              {approvedMembers.length} anggota
              {pendingMembers.length > 0 ? ` · ${pendingMembers.length} menunggu` : ""}
              <ChevronDown
                className={`size-3 transition ${membersOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
          </div>
          {isOwner ? (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="tap-target grid size-9 place-items-center rounded-lg text-content-secondary transition hover:bg-white/[0.06] hover:text-accent"
                aria-label="Undang anggota"
                title="Undang anggota"
              >
                <UserPlus className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => void destroy()}
                className="tap-target grid size-9 place-items-center rounded-lg text-content-muted transition hover:bg-red-500/10 hover:text-red-400"
                aria-label="Hapus diskusi"
                title="Hapus diskusi"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void leave()}
              className="tap-target grid size-9 place-items-center rounded-lg text-content-muted transition hover:bg-red-500/10 hover:text-red-400"
              aria-label="Keluar dari diskusi"
              title="Keluar"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>

        {membersOpen ? (
          <div className="mt-2 max-h-64 space-y-3 overflow-y-auto rounded-xl border border-ink-600 bg-ink-900/70 p-2.5">
            {discussion.description ? (
              <p className="px-1 text-[11px] leading-relaxed text-content-secondary">
                {discussion.description}
              </p>
            ) : null}

            {isOwner && pendingMembers.length > 0 ? (
              <div>
                <p className="px-1 pb-1 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
                  Menunggu persetujuan
                </p>
                <ul className="space-y-1">
                  {pendingMembers.map((member) => {
                    const key = `${member.discussion_id}:${member.user_id}`;
                    return (
                      <li key={member.user_id} className="flex items-center gap-2 rounded-lg bg-ink-800 p-1.5">
                        <Avatar
                          src={member.profile?.avatar_url}
                          name={memberName(member)}
                          size="xs"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-medium text-content-primary">
                            {memberName(member)}
                          </span>
                          <span className="block truncate text-[9px] text-content-muted">
                            @{member.profile?.username}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => void updateStatus(member, "rejected")}
                          disabled={busyKey === key}
                          className="grid size-8 place-items-center rounded-lg text-content-muted transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                          aria-label="Tolak anggota"
                        >
                          <X className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void updateStatus(member, "approved")}
                          disabled={busyKey === key}
                          className="grid size-8 place-items-center rounded-lg bg-accent text-ink-950 transition hover:bg-accent-hover disabled:opacity-50"
                          aria-label="Setujui anggota"
                        >
                          <Check className="size-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            <div>
              <p className="px-1 pb-1 text-[9px] font-semibold uppercase tracking-wider text-content-muted">
                Anggota aktif
              </p>
              <ul className="space-y-0.5">
                {approvedMembers.map((member) => {
                  const key = `${member.discussion_id}:${member.user_id}`;
                  return (
                    <li key={member.user_id} className="flex items-center gap-2 rounded-lg px-1.5 py-1">
                      <Avatar
                        src={member.profile?.avatar_url}
                        name={memberName(member)}
                        size="xs"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 text-[11px] font-medium text-content-primary">
                          <span className="truncate">{memberName(member)}</span>
                          {member.role === "owner" ? (
                            <Crown className="size-2.5 shrink-0 text-accent" aria-label="Pemilik" />
                          ) : null}
                        </span>
                        <span className="block truncate text-[9px] text-content-muted">
                          @{member.profile?.username}
                          {member.user_id === me.id ? " · kamu" : ""}
                        </span>
                      </span>
                      {isOwner && member.user_id !== me.id ? (
                        <button
                          type="button"
                          onClick={() => void kick(member)}
                          disabled={busyKey === key}
                          className="grid size-7 place-items-center rounded-md text-content-muted transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                          aria-label={`Keluarkan ${memberName(member)}`}
                        >
                          <X className="size-3" />
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="flex items-start gap-1.5 px-1 text-[10px] leading-relaxed text-content-muted">
              <ShieldCheck className="mt-0.5 size-3 shrink-0 text-accent" aria-hidden />
              Hanya anggota yang disetujui dapat membaca dan mengirim pesan.
            </p>
          </div>
        ) : null}
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <span className="grid size-12 place-items-center rounded-2xl border border-ink-600 bg-ink-900 text-accent">
              <MessagesSquare className="size-5" aria-hidden />
            </span>
            <p className="mt-3 text-sm font-medium text-content-primary">
              Percakapan dimulai di sini
            </p>
            <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-content-muted">
              Sapa anggota lain dengan @username. Pesan terkirim secara realtime
              dan hanya terlihat oleh anggota ruang ini.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => {
              const own = message.sender_id === me.id;
              const dateLabel = new Date(message.created_at).toDateString();
              const showDate = dateLabel !== lastDate;
              lastDate = dateLabel;
              const senderName =
                message.sender?.full_name || message.sender?.username || "Kreator";

              return (
                <div key={message.id}>
                  {showDate ? (
                    <div className="my-3 flex items-center gap-2">
                      <span className="h-px flex-1 bg-ink-600/70" aria-hidden />
                      <span className="text-[9px] uppercase tracking-wide text-content-muted">
                        {formatDate(message.created_at)}
                      </span>
                      <span className="h-px flex-1 bg-ink-600/70" aria-hidden />
                    </div>
                  ) : null}

                  <div className={`flex items-start gap-2 ${own ? "flex-row-reverse" : ""}`}>
                    {!own ? (
                      <Avatar
                        src={message.sender?.avatar_url}
                        name={senderName}
                        size="xs"
                        className="mt-0.5"
                      />
                    ) : null}
                    <div className={`max-w-[85%] sm:max-w-[75%] ${own ? "items-end" : ""}`}>
                      {!own ? (
                        <p className="mb-0.5 px-1 text-[9px] text-content-muted">
                          {senderName}
                        </p>
                      ) : null}
                      <div
                        className={`rounded-2xl px-3 py-2 ${
                          own
                            ? "rounded-tr-md bg-accent text-ink-950"
                            : "rounded-tl-md border border-ink-600 bg-ink-700/80 text-content-primary"
                        }`}
                      >
                        <RichText
                          content={message.content}
                          className={`whitespace-pre-wrap break-words text-[13px] leading-relaxed ${
                            own ? "text-ink-950" : "text-content-primary"
                          }`}
                          mentionClassName={
                            own
                              ? "font-semibold underline decoration-ink-950/30"
                              : "font-medium text-accent-soft"
                          }
                          linkClassName={
                            own
                              ? "break-all font-medium underline decoration-ink-950/30"
                              : "break-all text-accent hover:underline"
                          }
                        />
                      </div>
                      <p
                        className={`mt-0.5 px-1 text-[9px] text-content-muted ${own ? "text-right" : ""}`}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative shrink-0 border-t border-ink-600 bg-ink-850/80 p-2.5 pb-[calc(0.625rem+var(--safe-bottom))] sm:p-3 sm:pb-3">
        {mentionSuggestions.length > 0 ? (
          <div className="absolute bottom-full left-2.5 right-2.5 mb-1 overflow-hidden rounded-xl border border-ink-600 bg-ink-900 shadow-xl">
            {mentionSuggestions.map((member) => (
              <button
                key={member.user_id}
                type="button"
                onClick={() => insertMention(member.profile?.username ?? "")}
                className="flex min-h-11 w-full items-center gap-2 px-3 py-1.5 text-left transition hover:bg-ink-700"
              >
                <Avatar
                  src={member.profile?.avatar_url}
                  name={memberName(member)}
                  size="xs"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-content-primary">
                    {memberName(member)}
                  </span>
                  <span className="block truncate text-[10px] text-content-muted">
                    @{member.profile?.username}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <form onSubmit={send} className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={handleDraftChange}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder="Tulis pesan… gunakan @username untuk menyebut anggota"
              maxLength={DISCUSSION_MESSAGE_MAX_LENGTH}
              className="max-h-[120px] min-h-11 w-full resize-none rounded-xl border border-ink-600 bg-ink-900 px-3 py-2.5 pr-3 text-[13px] leading-relaxed text-content-primary placeholder:text-content-muted focus:border-accent/60 focus:outline-none"
              aria-label="Tulis pesan diskusi"
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!draft.trim()}
            loading={sending}
            aria-label="Kirim pesan"
          >
            {!sending ? <Send className="size-4" aria-hidden /> : null}
          </Button>
        </form>
        <div className="mt-1 flex items-center justify-between px-1">
          <p className="text-[9px] text-content-muted">
            Enter mengirim · Shift+Enter baris baru
          </p>
          {draft.length > 2500 ? (
            <p className="text-[9px] tabular-nums text-content-muted">
              {draft.length}/{DISCUSSION_MESSAGE_MAX_LENGTH}
            </p>
          ) : null}
        </div>
      </div>

      <InviteMembersModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        discussion={discussion}
        ownerId={me.id}
        onInvited={() => router.refresh()}
      />
    </div>
  );
}
