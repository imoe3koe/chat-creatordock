"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { DISCUSSION_MESSAGE_MAX_LENGTH } from "@/lib/constants";
import {
  sanitizePlainText,
  sanitizeSingleLine,
  sanitizeUsername,
} from "@/lib/security/sanitize";
import type {
  ActionResult,
  DiscussionMember,
  DiscussionMessage,
  Profile,
} from "@/lib/types";

const MESSAGE_SELECT =
  "*, sender:profiles!discussion_messages_sender_id_fkey(id,username,full_name,avatar_url)";

export type CreateDiscussionInput = {
  title: string;
  description: string;
  usernames: string[];
};

export type CreateDiscussionResult = {
  discussionId: string;
  invited: string[];
  unknown: string[];
};

function normalizeUsernames(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => sanitizeUsername(value))
        .filter((value) => value.length >= 3),
    ),
  );
}

async function resolveProfiles(usernames: string[]): Promise<Profile[]> {
  if (usernames.length === 0) return [];
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,username,full_name,avatar_url")
    .in("username", usernames);
  return (data ?? []) as Profile[];
}

export async function createDiscussion(
  ownerId: string,
  input: CreateDiscussionInput,
): Promise<ActionResult<CreateDiscussionResult>> {
  const title = sanitizeSingleLine(input.title, 120);
  const description = sanitizePlainText(input.description, 500, {
    preserveNewlines: true,
  });
  const usernames = normalizeUsernames(input.usernames).filter(
    (name) => name.length > 0,
  );

  if (title.length < 3) {
    return { ok: false, error: "Judul diskusi minimal 3 karakter." };
  }

  const supabase = createSupabaseBrowserClient();
  const { data: discussion, error } = await supabase
    .from("discussions")
    .insert({ owner_id: ownerId, title, description: description || null })
    .select("id")
    .single();

  if (error || !discussion) {
    return { ok: false, error: "Diskusi gagal dibuat. Coba lagi." };
  }

  const discussionId = discussion.id as string;

  const { error: ownerError } = await supabase
    .from("discussion_members")
    .insert({
      discussion_id: discussionId,
      user_id: ownerId,
      role: "owner",
      status: "approved",
      invited_by: ownerId,
    });

  if (ownerError) {
    await supabase.from("discussions").delete().eq("id", discussionId);
    return { ok: false, error: "Keanggotaan pemilik gagal dibuat." };
  }

  const ownUsername = await getOwnUsername(ownerId);
  const requested = usernames.filter((name) => name !== ownUsername);
  const profiles = (await resolveProfiles(requested)).filter(
    (profile) => profile.id !== ownerId,
  );
  const unknown = requested.filter(
    (name) => !profiles.some((profile) => profile.username === name),
  );

  if (profiles.length > 0) {
    const { error: inviteError } = await supabase
      .from("discussion_members")
      .insert(
        profiles.map((profile) => ({
          discussion_id: discussionId,
          user_id: profile.id,
          role: "member" as const,
          status: "pending" as const,
          invited_by: ownerId,
        })),
      );

    if (inviteError) {
      // The room exists; report a partial success instead of losing it.
      return {
        ok: true,
        data: { discussionId, invited: [], unknown },
        message: "Diskusi dibuat, tetapi undangan gagal dikirim.",
      };
    }
  }

  return {
    ok: true,
    data: {
      discussionId,
      invited: profiles.map((profile) => profile.username),
      unknown,
    },
    message: "Ruang diskusi dibuat.",
  };
}

let ownUsernameCache: { id: string; username: string } | null = null;

async function getOwnUsername(userId: string): Promise<string> {
  if (ownUsernameCache?.id === userId) return ownUsernameCache.username;
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  const username = (data?.username as string | undefined) ?? "";
  ownUsernameCache = { id: userId, username };
  return username;
}

export async function inviteMembers(
  discussionId: string,
  ownerId: string,
  usernames: string[],
): Promise<ActionResult<{ invited: string[]; unknown: string[] }>> {
  const requested = normalizeUsernames(usernames).filter((name) => name.length > 0);
  if (requested.length === 0) {
    return { ok: false, error: "Tulis minimal satu @username." };
  }

  const profiles = await resolveProfiles(requested);
  const unknown = requested.filter(
    (name) => !profiles.some((profile) => profile.username === name),
  );

  if (profiles.length === 0) {
    return {
      ok: false,
      error: `Username tidak ditemukan: ${requested.map((name) => `@${name}`).join(", ")}`,
    };
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("discussion_members").upsert(
    profiles.map((profile) => ({
      discussion_id: discussionId,
      user_id: profile.id,
      role: "member" as const,
      status: "pending" as const,
      invited_by: ownerId,
    })),
    { onConflict: "discussion_id,user_id", ignoreDuplicates: true },
  );

  if (error) {
    return { ok: false, error: "Undangan gagal dikirim." };
  }

  return {
    ok: true,
    data: {
      invited: profiles.map((profile) => profile.username),
      unknown,
    },
    message: "Undangan dikirim. Menunggu persetujuanmu.",
  };
}

export async function setMemberStatus(
  discussionId: string,
  userId: string,
  status: "approved" | "rejected",
): Promise<ActionResult> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("discussion_members")
    .update({ status })
    .eq("discussion_id", discussionId)
    .eq("user_id", userId);

  if (error) {
    return {
      ok: false,
      error: status === "approved" ? "Anggota gagal disetujui." : "Permintaan gagal ditolak.",
    };
  }

  return {
    ok: true,
    message: status === "approved" ? "Anggota disetujui." : "Permintaan ditolak.",
  };
}

export async function removeMember(
  discussionId: string,
  userId: string,
): Promise<ActionResult> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("discussion_members")
    .delete()
    .eq("discussion_id", discussionId)
    .eq("user_id", userId);

  if (error) return { ok: false, error: "Anggota gagal dikeluarkan." };
  return { ok: true, message: "Anggota dikeluarkan dari diskusi." };
}

export async function leaveDiscussion(
  discussionId: string,
  userId: string,
): Promise<ActionResult> {
  return removeMember(discussionId, userId);
}

export async function deleteDiscussion(discussionId: string): Promise<ActionResult> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("discussions").delete().eq("id", discussionId);
  if (error) return { ok: false, error: "Diskusi gagal dihapus." };
  return { ok: true, message: "Diskusi dihapus." };
}

export async function fetchDiscussionMessages(
  discussionId: string,
): Promise<DiscussionMessage[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("discussion_messages")
    .select(MESSAGE_SELECT)
    .eq("discussion_id", discussionId)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) throw new Error(error.message);
  // Keep the newest 300 messages, then present them oldest-first.
  return ((data ?? []) as unknown as DiscussionMessage[]).slice().reverse();
}

export async function sendDiscussionMessage(
  discussionId: string,
  senderId: string,
  content: string,
): Promise<ActionResult<DiscussionMessage>> {
  const clean = sanitizePlainText(content, DISCUSSION_MESSAGE_MAX_LENGTH, {
    preserveNewlines: true,
  });
  if (!clean) return { ok: false, error: "Pesan tidak boleh kosong." };

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("discussion_messages")
    .insert({
      discussion_id: discussionId,
      sender_id: senderId,
      content: clean,
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error) {
    return { ok: false, error: "Pesan gagal dikirim. Coba lagi." };
  }

  return { ok: true, data: data as unknown as DiscussionMessage };
}
