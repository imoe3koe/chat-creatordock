"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isNavActive } from "../nav-config";

export function BottomNav({ pendingApprovals = 0 }: { pendingApprovals?: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-ink-600/80 bg-ink-950/95 pt-1.5 backdrop-blur-xl lg:hidden"
      aria-label="Navigasi utama"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`relative mx-auto flex min-h-[52px] w-full max-w-[72px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition ${
                  active
                    ? "text-accent"
                    : "text-content-muted active:bg-white/[0.06]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className="relative">
                  <item.icon className="size-[21px]" strokeWidth={active ? 2.4 : 1.9} />
                  {item.href === "/discussions" && pendingApprovals > 0 ? (
                    <span className="absolute -right-2 -top-1 grid size-4 place-items-center rounded-full bg-accent text-[8px] font-bold text-ink-950">
                      {pendingApprovals > 9 ? "9+" : pendingApprovals}
                    </span>
                  ) : null}
                </span>
                <span className={active ? "font-semibold" : ""}>{item.label}</span>
                {active ? (
                  <span className="absolute -top-1.5 h-0.5 w-6 rounded-full bg-accent" aria-hidden />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
