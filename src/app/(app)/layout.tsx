import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/server";
import { getLayoutData } from "@/modules/layout/queries";
import { LeftSidebar } from "@/modules/layout/components/left-sidebar";
import { RightSidebar } from "@/modules/layout/components/right-sidebar";
import { MobileChrome } from "@/modules/layout/components/mobile-chrome";
import { PresenceProvider } from "@/modules/layout/components/presence-provider";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const data = await getLayoutData(user.id);

  return (
    <PresenceProvider me={profile}>
      <div className="min-h-dvh">
        <MobileChrome
          profile={profile}
          discussions={data.discussions}
          pages={data.pages}
          recentUsers={data.recentUsers}
          pendingApprovals={data.pendingApprovals}
          savedCount={data.savedCount}
          galleryCount={data.galleryCount}
        />

        <div className="page-container grid grid-cols-1 gap-4 pb-28 pt-4 lg:grid-cols-[230px_minmax(0,1fr)_270px] lg:gap-5 lg:pb-8 lg:pt-5 xl:grid-cols-[260px_minmax(0,680px)_300px] xl:justify-center 2xl:gap-6">
          <aside className="hidden min-w-0 lg:block" aria-label="Sidebar profil dan diskusi">
            <LeftSidebar
              profile={profile}
              discussions={data.discussions}
              gallery={data.gallery}
              savedCount={data.savedCount}
              galleryCount={data.galleryCount}
              postCount={data.postCount}
              pendingApprovals={data.pendingApprovals}
              pages={data.pages}
            />
          </aside>

          <main id="main-content" className="min-w-0">
            {children}
          </main>

          <aside className="hidden min-w-0 lg:block" aria-label="Sidebar promo dan kreator online">
            <RightSidebar
              promos={data.promos}
              recentUsers={data.recentUsers}
              meId={user.id}
            />
          </aside>
        </div>
      </div>
    </PresenceProvider>
  );
}
