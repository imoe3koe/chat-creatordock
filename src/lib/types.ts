export type Profile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  phone: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  author_id: string;
  content: string;
  link_url: string | null;
  media_url: string | null;
  media_type: "image" | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
};

export type PostComment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
};

export type PostWithRelations = Post & {
  author: Profile | null;
  post_likes: { user_id: string }[];
  post_comments: (PostComment & { author: Profile | null })[];
};

export type SavedArticle = {
  id: string;
  user_id: string;
  post_id: string | null;
  title: string;
  content: string;
  source_url: string | null;
  media_url: string | null;
  author_name: string | null;
  created_at: string;
};

export type GalleryItem = {
  id: string;
  user_id: string;
  storage_path: string;
  public_url: string;
  caption: string | null;
  file_size: number | null;
  created_at: string;
};

export type Promo = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string | null;
  link_url: string | null;
  instagram: string | null;
  tiktok: string | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  author?: Profile | null;
};

export type Discussion = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  owner?: Profile | null;
  discussion_members?: DiscussionMember[];
};

export type DiscussionMember = {
  discussion_id: string;
  user_id: string;
  role: "owner" | "member";
  status: "pending" | "approved" | "rejected";
  invited_by: string | null;
  created_at: string;
  profile?: Profile | null;
};

export type DiscussionMessage = {
  id: string;
  discussion_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile | null;
};

export type LinkPreview = {
  url: string;
  domain: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };
