"use client";

import { useState } from "react";
import type { Discussion, Profile } from "@/lib/types";
import type { PageLink } from "@/lib/wordpress/client";
import { BottomNav } from "./bottom-nav";
import { MobileDrawer } from "./mobile-drawer";
import { MobileHeader } from "./mobile-header";

export function MobileChrome({
  profile,
  discussions,
  pages,
  recentUsers,
  pendingApprovals,
  savedCount,
  galleryCount,
}: {
  profile: Profile;
  discussions: Discussion[];
  pages: PageLink[];
  recentUsers: Profile[];
  pendingApprovals: number;
  savedCount: number;
  galleryCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <MobileHeader onOpenMenu={() => setOpen(true)} />
      <MobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        profile={profile}
        discussions={discussions}
        pages={pages}
        recentUsers={recentUsers}
        pendingApprovals={pendingApprovals}
        savedCount={savedCount}
        galleryCount={galleryCount}
      />
      <BottomNav pendingApprovals={pendingApprovals} />
    </>
  );
}
