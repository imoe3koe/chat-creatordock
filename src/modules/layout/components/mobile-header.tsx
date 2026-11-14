"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Settings } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { NAV_ITEMS, isNavActive } from "../nav-config";

export function MobileHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-ink-600/80 bg-ink-950/90 backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center justify-between gap-2 px-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenMenu}
            className="tap-target grid size-11 place-items-center rounded-xl text-content-primary transition active:bg-white/10"
            aria-label="Buka menu navigasi"
            aria-haspopup="dialog"
          >
            <Menu className="size-5" />
          </button>
          <Logo compact />
          <span className="ml-1.5 text-[15px] font-bold tracking-tight">
            Creator<span className="text-accent">Chat</span>
          </span>
        </div>

        <nav className="flex items-center gap-0.5" aria-label="Pintasan">
          {NAV_ITEMS.slice(1, 4).map((item) => {
            const active = isNavActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`tap-target grid size-10 place-items-center rounded-xl transition ${
                  active ? "bg-accent-muted text-accent" : "text-content-secondary active:bg-white/10"
                }`}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="size-[18px]" />
              </Link>
            );
          })}
          <Link
            href="/settings"
            className="tap-target grid size-11 place-items-center rounded-xl text-content-secondary transition active:bg-white/10"
            aria-label="Pengaturan akun"
          >
            <Settings className="size-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
