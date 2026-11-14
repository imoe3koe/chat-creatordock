"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export type PresenceUser = Pick<
  Profile,
  "id" | "username" | "full_name" | "avatar_url"
> & { online_at?: string };

type PresenceContextValue = {
  onlineUsers: PresenceUser[];
  isOnline: (userId: string) => boolean;
};

const PresenceContext = createContext<PresenceContextValue>({
  onlineUsers: [],
  isOnline: () => false,
});

function uniqueById(users: PresenceUser[]): PresenceUser[] {
  const map = new Map<string, PresenceUser>();
  users.forEach((user) => {
    if (user?.id) map.set(user.id, user);
  });
  return Array.from(map.values()).sort((a, b) =>
    (a.full_name || a.username).localeCompare(b.full_name || b.username),
  );
}

function readPresence(channel: RealtimeChannel): PresenceUser[] {
  const state = channel.presenceState() as Record<string, PresenceUser[]>;
  return uniqueById(Object.values(state).flat());
}

export function PresenceProvider({
  me,
  children,
}: {
  me: Profile | null;
  children: React.ReactNode;
}) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presencePayload = useMemo<PresenceUser | null>(
    () =>
      me
        ? {
            id: me.id,
            username: me.username,
            full_name: me.full_name,
            avatar_url: me.avatar_url,
            online_at: new Date().toISOString(),
          }
        : null,
    [me],
  );

  const heartbeat = useCallback(async () => {
    if (!me) return;
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.rpc("touch_last_seen");
    } catch {
      // Presence is non-critical; ignore failures.
    }
  }, [me]);

  useEffect(() => {
    if (!me || !presencePayload) return;

    let supabase: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      return;
    }

    const channel = supabase.channel("creatorchat:presence", {
      config: {
        presence: {
          key: me.id,
        },
      },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        setOnlineUsers(readPresence(channel));
      })
      .on("presence", { event: "join" }, () => {
        setOnlineUsers(readPresence(channel));
      })
      .on("presence", { event: "leave" }, () => {
        setOnlineUsers(readPresence(channel));
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          void channel.track(presencePayload);
          void heartbeat();
        }
      });

    const interval = window.setInterval(() => {
      void heartbeat();
      void channel.track({
        ...presencePayload,
        online_at: new Date().toISOString(),
      });
    }, 90_000);

    return () => {
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [me, presencePayload, heartbeat]);

  const isOnline = useCallback(
    (userId: string) => onlineUsers.some((user) => user.id === userId),
    [onlineUsers],
  );

  return (
    <PresenceContext.Provider value={{ onlineUsers, isOnline }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}
