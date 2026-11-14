"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  Camera,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  LockKeyhole,
  LogOut,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { checkClientRateLimit } from "@/lib/security/rate-limit";
import { formatBytes, formatFullDate } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { requestEmailChange, updatePassword, updateProfile } from "../api";

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-ink-800 ${
        tone === "danger" ? "border-red-500/20" : "border-ink-600"
      }`}
    >
      <header className="border-b border-ink-600 px-4 py-3.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-content-primary">
          <span
            className={`grid size-7 place-items-center rounded-lg ${
              tone === "danger"
                ? "bg-red-500/10 text-red-400"
                : "bg-accent-muted text-accent"
            }`}
          >
            <Icon className="size-3.5" />
          </span>
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-[11px] leading-relaxed text-content-muted">
            {description}
          </p>
        ) : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function SettingsView({
  profile,
  email,
  createdAt,
  lastSignIn,
}: {
  profile: Profile;
  email: string;
  createdAt?: string;
  lastSignIn?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: profile.full_name ?? "",
    username: profile.username,
    bio: profile.bio ?? "",
    website: profile.website ?? "",
    phone: profile.phone ?? "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  function pickAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Foto profil maksimal 2MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Gunakan JPG, PNG, atau WEBP.");
      return;
    }
    setAvatarFile(file);
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    const limit = checkClientRateLimit("settings:profile", {
      limit: 8,
      windowMs: 60_000,
    });
    if (!limit.allowed) {
      toast.error("Terlalu banyak perubahan. Tunggu sebentar.");
      return;
    }

    setSavingProfile(true);
    const result = await updateProfile(
      profile.id,
      {
        fullName: form.fullName,
        username: form.username,
        bio: form.bio,
        website: form.website,
        phone: form.phone,
      },
      avatarFile,
      profile.avatar_url,
    );
    setSavingProfile(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Profil diperbarui.");
    setAvatarFile(null);
    router.refresh();
  }

  async function changeEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!newEmail.trim()) return;
    if (newEmail.trim().toLowerCase() === email.toLowerCase()) {
      toast.error("Email baru sama dengan email saat ini.");
      return;
    }
    const limit = checkClientRateLimit("settings:email", {
      limit: 3,
      windowMs: 120_000,
    });
    if (!limit.allowed) {
      toast.error("Terlalu banyak permintaan. Tunggu beberapa menit.");
      return;
    }

    setSavingEmail(true);
    const result = await requestEmailChange(newEmail);
    setSavingEmail(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? "Konfirmasi email dikirim.");
    setNewEmail("");
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    const limit = checkClientRateLimit("settings:password", {
      limit: 4,
      windowMs: 120_000,
    });
    if (!limit.allowed) {
      toast.error("Terlalu banyak percobaan. Tunggu beberapa menit.");
      return;
    }

    setSavingPassword(true);
    const result = await updatePassword(password, confirm);
    setSavingPassword(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success(result.message ?? "Password diperbarui.");
  }

  return (
    <div className="space-y-4">
      <header className="px-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
          Akun & keamanan
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
          <ShieldCheck className="size-5 text-accent" aria-hidden />
          Pengaturan
        </h1>
        <p className="mt-1 max-w-xl text-xs leading-relaxed text-content-secondary">
          Kelola identitas kreatormu, alamat email, dan cara masuk ke akun.
          Perubahan profil langsung tampil di seluruh ruang.
        </p>
      </header>

      <SettingsCard
        icon={UserRound}
        title="Profil publik"
        description="Nama dan username ini terlihat oleh kreator lain di diskusi, promo, dan komentar."
      >
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Avatar
                src={avatarPreview ?? profile.avatar_url}
                name={form.fullName || form.username}
                size="2xl"
                className="rounded-full"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-full border-2 border-ink-800 bg-accent text-ink-950 transition hover:bg-accent-hover"
                aria-label="Ganti foto profil"
              >
                <Camera className="size-4" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={pickAvatar}
                aria-label="Unggah foto profil"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-content-primary">
                {form.fullName || form.username}
              </p>
              <p className="text-xs text-content-muted">@{form.username}</p>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="mt-1.5 text-[11px] font-medium text-accent hover:underline"
              >
                {avatarFile ? "Ganti pilihan foto" : "Unggah foto baru"}
              </button>
              <p className="mt-1 text-[10px] text-content-muted">
                JPG, PNG, WEBP · maks. 2MB
                {avatarFile ? ` · ${formatBytes(avatarFile.size)}` : ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nama lengkap" htmlFor="fullName">
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                maxLength={100}
                autoComplete="name"
                required
              />
            </Field>
            <Field label="Username" htmlFor="username" hint="Huruf kecil, angka, _">
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-muted" aria-hidden />
                <Input
                  id="username"
                  value={form.username}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      username: event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "")
                        .slice(0, 30),
                    })
                  }
                  className="pl-10"
                  maxLength={30}
                  autoComplete="username"
                  required
                />
              </div>
            </Field>
          </div>

          <Field label="Bio" htmlFor="bio" hint={`${form.bio.length}/300`}>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
              placeholder="Ceritakan bidang kreatifmu dalam satu-dua kalimat."
              maxLength={300}
              className="min-h-20"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Website" htmlFor="website" hint="Opsional">
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-muted" aria-hidden />
                <Input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={(event) => setForm({ ...form, website: event.target.value })}
                  placeholder="https://portofolio.com"
                  className="pl-10"
                  maxLength={2048}
                />
              </div>
            </Field>
            <Field label="Telepon" htmlFor="phone" hint="Opsional">
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-muted" aria-hidden />
                <Input
                  id="phone"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="+62 812 3456 7890"
                  className="pl-10"
                  maxLength={24}
                />
              </div>
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-ink-600 pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setForm({
                  fullName: profile.full_name ?? "",
                  username: profile.username,
                  bio: profile.bio ?? "",
                  website: profile.website ?? "",
                  phone: profile.phone ?? "",
                })
              }
              disabled={savingProfile}
            >
              Reset
            </Button>
            <Button type="submit" loading={savingProfile}>
              <Save className="size-4" aria-hidden />
              Simpan profil
            </Button>
          </div>
        </form>
      </SettingsCard>

      <SettingsCard
        icon={Mail}
        title="Alamat email"
        description="Email dipakai untuk magic link, OTP, dan pemulihan akun. Perubahan memerlukan konfirmasi."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-600 bg-ink-900/60 px-3.5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-content-primary">{email}</p>
              <p className="mt-0.5 text-[10px] text-content-muted">
                Email saat ini
              </p>
            </div>
            <Badge tone="success">
              <Check className="size-2.5" aria-hidden />
              Terverifikasi
            </Badge>
          </div>

          <form onSubmit={changeEmail} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field label="Email baru" htmlFor="newEmail" className="flex-1">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-muted" aria-hidden />
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  placeholder="email-baru@contoh.com"
                  className="pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </Field>
            <Button type="submit" variant="secondary" loading={savingEmail}>
              Kirim konfirmasi
            </Button>
          </form>
          <p className="text-[10px] leading-relaxed text-content-muted">
            Supabase mengirim tautan ke email lama dan baru. Email baru aktif
            setelah kedua tautan dikonfirmasi.
          </p>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={LockKeyhole}
        title="Password"
        description="Akun CreatorChat memakai OTP/magic link. Password opsional, tetapi berguna sebagai cadangan."
      >
        <form onSubmit={changePassword} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Password baru" htmlFor="newPassword" hint="Min. 8 karakter">
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-muted" aria-hidden />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-11"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-lg text-content-muted hover:text-content-primary"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
            <Field label="Konfirmasi" htmlFor="confirmPassword">
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-content-muted">
              Lupa password lama? Keluar lalu gunakan halaman reset.
            </p>
            <Button type="submit" variant="secondary" loading={savingPassword}>
              Perbarui password
            </Button>
          </div>
        </form>
      </SettingsCard>

      <SettingsCard
        icon={LogOut}
        title="Sesi akun"
        description="Kelola sesi perangkat ini atau keluar dari akun."
        tone="danger"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-ink-600 bg-ink-900/60 px-3 py-2.5">
              <p className="text-[9px] uppercase tracking-wider text-content-muted">Akun dibuat</p>
              <p className="mt-0.5 text-xs text-content-secondary">
                {createdAt ? formatFullDate(createdAt) : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-ink-600 bg-ink-900/60 px-3 py-2.5">
              <p className="text-[9px] uppercase tracking-wider text-content-muted">Login terakhir</p>
              <p className="mt-0.5 text-xs text-content-secondary">
                {lastSignIn ? formatFullDate(lastSignIn) : "—"}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </SettingsCard>
    </div>
  );
}
