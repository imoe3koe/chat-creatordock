import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Discussion,
  DiscussionMember,
  DiscussionMessage,
} from "@/lib/types";

const MEMBER_SELECT = `
  discussion_id,
  user_id,
  role,
  status,
  invited_by,
  created_at,
  profile:profiles!discussion_members_user_id_fkey(id,username,full_name,avatar_url,last_seen_at)
`;

const DISCUSSION_SELECT = `
  *,
  owner:profiles!discussions_owner_id_fkey(id,username,full_name,avatar_url),
  discussion_members(${MEMBER_SELECT})
`;

export type DiscussionWithMembers = Discussion & {
  discussion_members: DiscussionMember[];
};

export async function getDiscussions(): Promise<DiscussionWithMembers[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("discussions")
    .select(DISCUSSION_SELECT)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[discussions] getDiscussions:", error.message);
    return [];
  }

  return (data ?? []) as unknown as DiscussionWithMembers[];
}

export async function getDiscussion(
  id: string,
): Promise<DiscussionWithMembers | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("discussions")
    .select(DISCUSSION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[discussions] getDiscussion:", error.message);
    return null;
  }

  return (data as unknown as DiscussionWithMembers | null) ?? null;
}

export async function getMembershipStatus(
  discussionId: string,
  userId: string,
): Promise<"owner" | "pending" | "approved" | "rejected" | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("discussion_members")
    .select("role, status")
    .eq("discussion_id", discussionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  if (data.role === "owner") return "owner";
  return data.status as "pending" | "approved" | "rejected";
}

export async function getDiscussionMessages(
  discussionId: string,
): Promise<DiscussionMessage[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("discussion_messages")
    .select(
      "*, sender:profiles!discussion_messages_sender_id_fkey(id,username,full_name,avatar_url)",
    )
    .eq("discussion_id", discussionId)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("[discussions] getDiscussionMessages:", error.message);
    return [];
  }

  // Keep the newest 300 messages, then present them oldest-first.
  return ((data ?? []) as unknown as DiscussionMessage[]).slice().reverse();
}

export type PendingApproval = DiscussionMember & {
  discussion: { id: string; title: string; owner_id: string } | null;
};

export async function getPendingApprovals(
  userId: string,
): Promise<PendingApproval[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("discussion_members")
    .select(
      `discussion_id, user_id, role, status, invited_by, created_at,
       profile:profiles!discussion_members_user_id_fkey(id,username,full_name,avatar_url),
       discussion:discussions!discussion_members_discussion_id_fkey(id,title,owner_id)`,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[discussions] getPendingApprovals:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as PendingApproval[]).filter(
    (row) => row.discussion?.owner_id === userId,
  );
}
