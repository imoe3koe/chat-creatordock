"use client";

import Link from "next/link";
import { Circle, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { usePresence } from "./presence-provider";
import type { Profile } from "@/lib/types";

export function OnlineUsers({
  recentUsers,
  meId,
  compact = false,
}: {
  recentUsers: Profile[];
  meId: string;
  compact?: boolean;
}) {
  const { onlineUsers } = usePresence();

  const merged = new Map<string, { id: string; username: string; full_name: string; avatar_url: string | null }>();
  onlineUsers.forEach((user) => merged.set(user.id, user));
  recentUsers.forEach((user) => {
    if (!merged.has(user.id)) {
      merged.set(user.id, {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      });
    }
  });

  const users = Array.from(merged.values()).slice(0, compact ? 6 : 9);
  const onlineIds = new Set(onlineUsers.map((user) => user.id));
  const count = onlineUsers.length;

  return (
    <section className="rounded-2xl border border-ink-600 bg-ink-800 shadow-card">
      <header className="flex items-center justify-between border-b border-ink-600 px-4 py-3">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-content-muted">
          <Users className="size-3.5 text-emerald-400" aria-hidden />
          Kreator Online
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          {count > 0 ? count : "—"}
        </span>
      </header>

      <div className={compact ? "p-2" : "p-2.5"}>
        {users.length === 0 ? (
          <p className="px-2 py-3 text-[11px] leading-relaxed text-content-muted">
            Belum ada kreator lain yang online. Ajak temanmu bergabung!
          </p>
        ) : (
          <ul className="space-y-0.5">
            {users.map((user) => {
              const isMe = user.id === meId;
              const isOnline = onlineIds.has(user.id);
              return (
                <li key={user.id}>
                  <div className="flex min-h-10 items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition hover:bg-ink-700/60">
                    <Avatar
                      src={user.avatar_url}
                      name={user.full_name || user.username}
                      size="xs"
                      online={isOnline}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-content-primary">
                        {user.full_name || user.username}
                        {isMe ? <span className="ml-1 text-content-muted">(kamu)</span> : null}
                      </p>
                      <p className="truncate text-[10px] text-content-muted">@{user.username}</p>
                    </div>
                    <Circle
                      className={isOnline ? "size-1.5 fill-emerald-400 text-emerald-400" : "size-1.5 fill-ink-600 text-ink-600"}
                      aria-label={isOnline ? "Online" : "Baru aktif"}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href="/settings"
          className="mt-1.5 flex min-h-8 items-center justify-center rounded-lg border border-ink-600/60 text-[10px] font-medium text-content-muted transition hover:border-accent/30 hover:text-content-secondary"
        >
          Kelola profil kamu
        </Link>
      </div>
    </section>
  );
}
