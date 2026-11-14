import Link from "next/link";
import {
  ArrowUpRight,
  Mail,
  Megaphone,
  Phone,
  Plus,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { Promo, Profile } from "@/lib/types";
import { getDomain, truncate } from "@/lib/utils";
import { OnlineUsers } from "./online-users";

export function PromoWidget({ promos }: { promos: Promo[] }) {
  const promo = promos[0];

  return (
    <section className="overflow-hidden rounded-2xl border border-ink-600 bg-ink-800 shadow-card">
      <header className="flex items-center justify-between border-b border-ink-600 px-4 py-3">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-content-muted">
          <Sparkles className="size-3.5 text-accent" aria-hidden />
          Promo Kreator
        </h2>
        <Link
          href="/promo"
          className="rounded-md px-1.5 py-1 text-[11px] font-medium text-accent hover:bg-accent-muted"
        >
          Etalase
        </Link>
      </header>

      {promo ? (
        <div>
          {promo.image_url ? (
            <Link href={promo.link_url || "/promo"} className="group block relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={promo.image_url}
                alt={promo.title}
                className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                loading="lazy"
              />
              <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                Aktif
              </span>
            </Link>
          ) : null}

          <div className="p-4">
            <div className="flex items-center gap-2">
              <Avatar
                src={promo.author?.avatar_url}
                name={promo.author?.full_name || promo.author?.username}
                size="xs"
              />
              <span className="truncate text-[11px] text-content-muted">
                @{promo.author?.username ?? "kreator"}
              </span>
            </div>
            <h3 className="mt-2 text-sm font-semibold leading-snug text-content-primary">
              {promo.title}
            </h3>
            <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-content-secondary">
              {truncate(promo.description, 180)}
            </p>

            {promo.link_url ? (
              <a
                href={promo.link_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
              >
                {getDomain(promo.link_url) || "Kunjungi tautan"}
                <ArrowUpRight className="size-3" aria-hidden />
              </a>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {promo.whatsapp || promo.phone ? (
                <a
                  href={
                    promo.whatsapp
                      ? `https://wa.me/${promo.whatsapp.replace(/\D/g, "")}`
                      : `tel:${promo.phone?.replace(/[^\d+]/g, "")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-900 px-2.5 text-[10px] font-medium text-content-secondary transition hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  <Phone className="size-3" aria-hidden />
                  Kontak
                </a>
              ) : null}
              {promo.email ? (
                <a
                  href={`mailto:${promo.email}`}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-900 px-2.5 text-[10px] font-medium text-content-secondary transition hover:border-accent/40 hover:text-accent"
                >
                  <Mail className="size-3" aria-hidden />
                  Email
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex flex-col items-center rounded-xl border border-dashed border-ink-600 px-4 py-6 text-center">
            <span className="grid size-10 place-items-center rounded-xl bg-accent-muted text-accent">
              <Megaphone className="size-4.5" aria-hidden />
            </span>
            <p className="mt-3 text-xs font-medium text-content-primary">Ruang promosi tersedia</p>
            <p className="mt-1 text-[11px] leading-relaxed text-content-muted">
              Tampilkan karya, jasa, atau produkmu ke seluruh kreator.
            </p>
            <Link
              href="/promo"
              className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-[11px] font-semibold text-ink-950 transition hover:bg-accent-hover"
            >
              <Plus className="size-3" aria-hidden />
              Buat promo
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

export function RightSidebar({
  promos,
  recentUsers,
  meId,
}: {
  promos: Promo[];
  recentUsers: Profile[];
  meId: string;
}) {
  return (
    <div className="space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:pb-4 scrollbar-none">
      <PromoWidget promos={promos} />
      <OnlineUsers recentUsers={recentUsers} meId={meId} />
      {promos.length > 1 ? (
        <section className="rounded-2xl border border-ink-600 bg-ink-800 p-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">
            Promo lainnya
          </h2>
          <ul className="mt-2.5 space-y-2">
            {promos.slice(1, 3).map((promo) => (
              <li key={promo.id}>
                <Link
                  href="/promo"
                  className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-ink-700/70"
                >
                  <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-ink-700 text-accent">
                    {promo.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={promo.image_url} alt="" className="size-full object-cover" loading="lazy" />
                    ) : (
                      <Megaphone className="size-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-medium text-content-primary">{promo.title}</span>
                    <span className="block truncate text-[10px] text-content-muted">@{promo.author?.username ?? "kreator"}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/promo" className="mt-3 flex items-center justify-between text-[11px] text-accent hover:underline">
            Lihat semua promo <ArrowUpRight className="size-3" aria-hidden />
          </Link>
        </section>
      ) : null}
      <p className="px-2 text-[10px] leading-relaxed text-content-muted/70">
        CreatorChat hanya menampilkan promo yang aktif. Laporkan konten mencurigakan
        melalui halaman kontak Creatordock.
      </p>
    </div>
  );
}
