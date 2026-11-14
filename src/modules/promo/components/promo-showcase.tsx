"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Camera,
  Check,
  Globe2,
  Instagram,
  Mail,
  Megaphone,
  MessageCircle,
  Music2,
  Pencil,
  Phone,
  Plus,
  Power,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { checkClientRateLimit } from "@/lib/security/rate-limit";
import type { Promo, Profile } from "@/lib/types";
import { getDomain, truncate } from "@/lib/utils";
import { savePromo, togglePromoActive, type PromoInput } from "../api";

const EMPTY_FORM: PromoInput = {
  title: "",
  description: "",
  linkUrl: "",
  instagram: "",
  tiktok: "",
  whatsapp: "",
  phone: "",
  email: "",
  isActive: true,
};

function socialLink(kind: "instagram" | "tiktok", handle?: string | null) {
  if (!handle) return null;
  const clean = handle.replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "");
  if (!clean) return null;
  return kind === "instagram"
    ? `https://instagram.com/${clean}`
    : `https://tiktok.com/@${clean}`;
}

function PromoCard({
  promo,
  isOwner,
  onEdit,
  onToggle,
  busy,
}: {
  promo: Promo;
  isOwner: boolean;
  onEdit: () => void;
  onToggle: () => void;
  busy: boolean;
}) {
  const igUrl = socialLink("instagram", promo.instagram);
  const tiktokUrl = socialLink("tiktok", promo.tiktok);
  const waUrl = promo.whatsapp
    ? `https://wa.me/${promo.whatsapp.replace(/\D/g, "")}`
    : null;
  const telUrl = promo.phone ? `tel:${promo.phone.replace(/[^\d+]/g, "")}` : null;

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-ink-800 shadow-card transition ${
        promo.is_active ? "border-ink-600 hover:border-accent/30" : "border-dashed border-ink-600 opacity-80"
      }`}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-accent/30 via-ink-700 to-ink-900">
        {promo.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={promo.image_url}
            alt={promo.title}
            className="size-full object-cover transition duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-accent-soft">
            <Megaphone className="size-8" aria-hidden />
            <span className="text-[10px] uppercase tracking-widest">Promo kreator</span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {promo.is_active ? (
            <span className="rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur">
              Aktif
            </span>
          ) : (
            <Badge tone="warning">Nonaktif</Badge>
          )}
        </div>
        {isOwner ? (
          <div className="absolute right-2 top-2 flex gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="grid size-8 place-items-center rounded-lg bg-black/65 text-white backdrop-blur transition hover:bg-black/90"
              aria-label="Edit promo"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={onToggle}
              disabled={busy}
              className="grid size-8 place-items-center rounded-lg bg-black/65 text-white backdrop-blur transition hover:bg-black/90 disabled:opacity-50"
              aria-label={promo.is_active ? "Nonaktifkan promo" : "Aktifkan promo"}
              title={promo.is_active ? "Nonaktifkan" : "Aktifkan"}
            >
              <Power className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <Avatar
            src={promo.author?.avatar_url}
            name={promo.author?.full_name || promo.author?.username}
            size="xs"
          />
          <span className="min-w-0 flex-1 truncate text-[11px] text-content-muted">
            {promo.author?.full_name || promo.author?.username || "Kreator"}
            {promo.author?.username ? ` · @${promo.author.username}` : ""}
          </span>
        </div>

        <h3 className="mt-2.5 text-base font-semibold leading-snug text-content-primary">
          {promo.title}
        </h3>
        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-content-secondary">
          {truncate(promo.description, 260)}
        </p>

        {promo.link_url ? (
          <a
            href={promo.link_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-accent hover:underline"
          >
            <Globe2 className="size-3.5" aria-hidden />
            {getDomain(promo.link_url) || "Kunjungi website"}
            <ArrowUpRight className="size-3" aria-hidden />
          </a>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {promo.whatsapp || promo.phone ? (
            <a
              href={waUrl || telUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 text-[10px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
            >
              <MessageCircle className="size-3.5" aria-hidden />
              WhatsApp
            </a>
          ) : null}
          {telUrl ? (
            <a
              href={telUrl}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-900 px-2.5 text-[10px] font-medium text-content-secondary transition hover:border-accent/40 hover:text-accent"
            >
              <Phone className="size-3.5" aria-hidden />
              Telepon
            </a>
          ) : null}
          {promo.email ? (
            <a
              href={`mailto:${promo.email}`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-900 px-2.5 text-[10px] font-medium text-content-secondary transition hover:border-accent/40 hover:text-accent"
            >
              <Mail className="size-3.5" aria-hidden />
              Email
            </a>
          ) : null}
          {igUrl ? (
            <a
              href={igUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="grid size-9 place-items-center rounded-lg border border-ink-600 bg-ink-900 text-content-secondary transition hover:border-pink-500/40 hover:text-pink-300"
              aria-label="Instagram"
            >
              <Instagram className="size-3.5" />
            </a>
          ) : null}
          {tiktokUrl ? (
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="grid size-9 place-items-center rounded-lg border border-ink-600 bg-ink-900 text-content-secondary transition hover:border-cyan-500/40 hover:text-cyan-300"
              aria-label="TikTok"
            >
              <Music2 className="size-3.5" />
            </a>
          ) : null}
        </div>

        {isOwner && !promo.is_active ? (
          <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[10px] text-amber-200">
            Promo nonaktif hanya terlihat olehmu. Aktifkan agar muncul di etalase
            dan widget beranda.
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function PromoShowcase({
  initialPromos,
  me,
}: {
  initialPromos: Promo[];
  me: Profile;
}) {
  const toast = useToast();
  const [promos, setPromos] = useState(initialPromos);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<PromoInput>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ownPromo = promos.find((promo) => promo.user_id === me.id) ?? null;
  const activePromos = promos.filter((promo) => promo.is_active);

  useEffect(() => {
    if (!imageFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function openForm(promo: Promo | null) {
    setForm(
      promo
        ? {
            title: promo.title,
            description: promo.description,
            linkUrl: promo.link_url ?? "",
            instagram: promo.instagram ?? "",
            tiktok: promo.tiktok ?? "",
            whatsapp: promo.whatsapp ?? "",
            phone: promo.phone ?? "",
            email: promo.email ?? "",
            isActive: promo.is_active,
          }
        : EMPTY_FORM,
    );
    setImageFile(null);
    setFormOpen(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const limit = checkClientRateLimit("promo:save", { limit: 8, windowMs: 60_000 });
    if (!limit.allowed) {
      toast.error("Terlalu banyak perubahan. Tunggu sebentar.");
      return;
    }

    setSaving(true);
    const result = await savePromo(me.id, form, imageFile, ownPromo?.image_url ?? null);
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    if (result.data) {
      const saved = result.data;
      setPromos((current) => {
        const exists = current.some((promo) => promo.user_id === me.id);
        if (exists) {
          return current.map((promo) => (promo.user_id === me.id ? saved : promo));
        }
        return [saved, ...current];
      });
    }
    setFormOpen(false);
    setImageFile(null);
    toast.success(result.message ?? "Promo disimpan.");
  }

  async function toggle(promo: Promo) {
    setBusyId(promo.id);
    const result = await togglePromoActive(promo.id, !promo.is_active);
    setBusyId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPromos((current) =>
      current.map((item) =>
        item.id === promo.id ? { ...item, is_active: !item.is_active } : item,
      ),
    );
    toast.success(result.message ?? "Status promo diubah.");
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            Etalase kreator
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            <Megaphone className="size-5 text-accent" aria-hidden />
            Promo & Layanan
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-content-secondary">
            Temukan jasa, produk, dan karya kreator lain. Punya penawaran?
            Tampilkan satu kartu promo di etalase dan sidebar beranda.
          </p>
        </div>
        <Button onClick={() => openForm(ownPromo)}>
          {ownPromo ? <Pencil className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          {ownPromo ? "Edit promo" : "Buat promo"}
        </Button>
      </header>

      {ownPromo ? (
        <section className="rounded-2xl border border-accent/25 bg-gradient-to-br from-accent-muted to-transparent p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-ink-950">
              <Sparkles className="size-4.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-content-primary">
                {ownPromo.is_active ? "Promomu sedang tampil" : "Promomu sedang nonaktif"}
                {ownPromo.is_active ? (
                  <Check className="size-3.5 text-emerald-400" aria-label="Aktif" />
                ) : null}
              </p>
              <p className="mt-0.5 text-[11px] text-content-secondary">
                {ownPromo.is_active
                  ? "Terlihat di etalase, sidebar kanan, dan drawer kreator."
                  : "Aktifkan agar dapat dilihat kreator lain."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => openForm(ownPromo)}>
                <Pencil className="size-3.5" aria-hidden /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void toggle(ownPromo)}
                loading={busyId === ownPromo.id}
              >
                <Power className="size-3.5" aria-hidden />
                {ownPromo.is_active ? "Nonaktifkan" : "Aktifkan"}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {activePromos.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Etalase masih kosong"
          description="Jadilah kreator pertama yang menampilkan promo. Unggah gambar, tulis penawaran, dan tambahkan kontak agar mudah dihubungi."
          action={
            <Button onClick={() => openForm(ownPromo)}>
              <Plus className="size-4" aria-hidden />
              Buat promo pertamamu
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {activePromos.map((promo) => (
            <PromoCard
              key={promo.id}
              promo={promo}
              isOwner={promo.user_id === me.id}
              onEdit={() => openForm(promo)}
              onToggle={() => void toggle(promo)}
              busy={busyId === promo.id}
            />
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => (saving ? null : setFormOpen(false))}
        title={ownPromo ? "Edit promo" : "Buat promo"}
        description="Satu kartu promo per kreator. Data kontak bersifat publik."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" form="promo-form" loading={saving}>
              <Check className="size-4" aria-hidden />
              Simpan promo
            </Button>
          </>
        }
      >
        <form id="promo-form" onSubmit={submit} className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-content-secondary">
              Gambar promo <span className="normal-case tracking-normal text-content-muted">(JPG/PNG/WEBP · maks. 2MB)</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                event.target.value = "";
                if (selected) setImageFile(selected);
              }}
              aria-label="Pilih gambar promo"
            />
            {preview || (ownPromo?.image_url && !imageFile) ? (
              <div className="relative overflow-hidden rounded-xl border border-ink-600">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview ?? ownPromo?.image_url ?? ""}
                  alt="Pratinjau promo"
                  className="aspect-video w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-2 top-2 rounded-lg bg-black/70 px-2.5 py-1.5 text-[10px] font-medium text-white backdrop-blur"
                >
                  Ganti gambar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-32 w-full flex-col items-center justify-center rounded-xl border border-dashed border-ink-600 bg-ink-900/60 p-4 transition hover:border-accent/50"
              >
                <Camera className="size-5 text-accent" aria-hidden />
                <span className="mt-1.5 text-xs text-content-secondary">
                  Unggah gambar promosi
                </span>
              </button>
            )}
          </div>

          <Field label="Judul promo" htmlFor="promo-title">
            <Input
              id="promo-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Jasa desain identitas brand"
              maxLength={120}
              required
            />
          </Field>

          <Field label="Deskripsi" htmlFor="promo-description" hint={`${form.description.length}/1200`}>
            <Textarea
              id="promo-description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Ceritakan penawaran, keunggulan, dan cara kerja layananmu."
              maxLength={1200}
              className="min-h-28"
              required
            />
          </Field>

          <Field label="Tautan website" htmlFor="promo-link" hint="Opsional">
            <Input
              id="promo-link"
              type="url"
              value={form.linkUrl}
              onChange={(event) => setForm({ ...form, linkUrl: event.target.value })}
              placeholder="https://karyamu.com"
              maxLength={2048}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Instagram" htmlFor="promo-ig" hint="Tanpa @">
              <Input
                id="promo-ig"
                value={form.instagram}
                onChange={(event) => setForm({ ...form, instagram: event.target.value })}
                placeholder="namakreatif"
                maxLength={60}
              />
            </Field>
            <Field label="TikTok" htmlFor="promo-tiktok" hint="Tanpa @">
              <Input
                id="promo-tiktok"
                value={form.tiktok}
                onChange={(event) => setForm({ ...form, tiktok: event.target.value })}
                placeholder="namakreatif"
                maxLength={60}
              />
            </Field>
            <Field label="WhatsApp" htmlFor="promo-wa" hint="Format 62…">
              <Input
                id="promo-wa"
                inputMode="tel"
                value={form.whatsapp}
                onChange={(event) => setForm({ ...form, whatsapp: event.target.value })}
                placeholder="6281234567890"
                maxLength={16}
              />
            </Field>
            <Field label="Telepon" htmlFor="promo-phone" hint="Opsional">
              <Input
                id="promo-phone"
                inputMode="tel"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="+62 812 3456 7890"
                maxLength={24}
              />
            </Field>
          </div>

          <Field label="Email kontak" htmlFor="promo-email">
            <Input
              id="promo-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="hello@karyamu.com"
              maxLength={254}
            />
          </Field>

          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-ink-600 bg-ink-900 px-3.5">
            <span>
              <span className="block text-xs font-medium text-content-primary">Tampilkan promo</span>
              <span className="block text-[10px] text-content-muted">
                Muncul di etalase dan widget sidebar.
              </span>
            </span>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              className="size-5 accent-[#FF6B00]"
            />
          </label>
        </form>
      </Modal>
    </div>
  );
}
