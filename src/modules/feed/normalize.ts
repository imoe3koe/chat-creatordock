import type { PostWithRelations } from "@/lib/types";
import { sanitizePlainText } from "@/lib/security/sanitize";

/**
 * Shared between server queries and client mutations. Keep this module free of
 * `next/headers` (or any server-only import) so it can be bundled for clients.
 */
export const POST_SELECT = `
  *,
  author:profiles!posts_author_id_fkey(id,username,full_name,avatar_url,bio,website,phone,last_seen_at,created_at,updated_at),
  post_likes(user_id),
  post_comments(
    id,
    post_id,
    author_id,
    content,
    created_at,
    author:profiles!post_comments_author_id_fkey(id,username,full_name,avatar_url,bio,website,phone,last_seen_at,created_at,updated_at)
  )
`;

export function normalizePosts(data: unknown): PostWithRelations[] {
  const rows = Array.isArray(data) ? data : [];
  return rows
    .map((raw) => {
      const post = raw as PostWithRelations;
      return {
        ...post,
        content: sanitizePlainText(post.content ?? "", 5000, {
          preserveNewlines: true,
        }),
        post_likes: Array.isArray(post.post_likes) ? post.post_likes : [],
        post_comments: Array.isArray(post.post_comments)
          ? [...post.post_comments]
              .map((comment) => ({
                ...comment,
                content: sanitizePlainText(comment.content ?? "", 1500, {
                  preserveNewlines: true,
                }),
              }))
              .sort(
                (a, b) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
              )
          : [],
      };
    })
    .filter((post) => Boolean(post.id));
}
