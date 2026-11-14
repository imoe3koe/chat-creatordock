"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { sanitizeEmail } from "@/lib/security/sanitize";
import { checkClientRateLimit } from "@/lib/security/rate-limit";
import { safeInternalPath } from "@/lib/security/redirect";

const OTP_LENGTH = 6;

const LOGIN_ERRORS: Record<string, string> = {
  config: "Autentikasi belum dikonfigurasi. Hubungi admin CreatorChat.",
  "link-expired": "Tautan sudah kedaluwarsa atau pernah dipakai. Minta kode baru.",
  "missing-code": "Tautan masuk tidak valid. Silakan minta kode baru.",
  callback: "Gagal menyelesaikan proses masuk. Coba lagi.",
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const next = safeInternalPath(params.get("next"));
  const errorCode = params.get("error");
  const errorMessage = errorCode
    ? LOGIN_ERRORS[errorCode] ?? "Terjadi masalah saat masuk. Silakan coba lagi."
    : null;

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function sendOtp(event?: React.FormEvent) {
    event?.preventDefault();
    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) {
      toast.error("Masukkan alamat email yang valid.");
      return;
    }

    const limit = checkClientRateLimit("auth:login", {
      limit: 4,
      windowMs: 60_000,
    });
    if (!limit.allowed) {
      toast.error(`Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(limit.retryAfterMs / 1000)} detik.`);
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        toast.error(
          error.message.toLowerCase().includes("signup")
            ? "Email ini belum terdaftar. Silakan buat akun terlebih dahulu."
            : "Tautan masuk gagal dikirim. Periksa email lalu coba lagi.",
        );
        return;
      }

      setStep("otp");
      setCooldown(60);
      toast.success("Kode masuk sudah dikirim. Cek inbox atau folder spam.");
    } catch {
      toast.error("Supabase belum dikonfigurasi atau koneksi gagal.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event: React.FormEvent) {
    event.preventDefault();
    const cleanEmail = sanitizeEmail(email);
    const token = otp.replace(/\D/g, "").slice(0, OTP_LENGTH);

    if (!cleanEmail || token.length !== OTP_LENGTH) {
      toast.error("Masukkan 6 digit kode dari email.");
      return;
    }

    const limit = checkClientRateLimit("auth:verify", {
      limit: 8,
      windowMs: 60_000,
    });
    if (!limit.allowed) {
      toast.error("Terlalu banyak percobaan verifikasi. Tunggu sebentar.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token,
        type: "email",
      });

      if (error) {
        toast.error("Kode salah atau sudah kedaluwarsa. Minta kode baru.");
        return;
      }

      toast.success("Berhasil masuk. Selamat datang kembali!");
      router.replace(next);
      router.refresh();
    } catch {
      toast.error("Verifikasi gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={verifyOtp} className="space-y-4">
        {errorMessage ? (
          <p
            role="alert"
            className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-sm leading-relaxed text-amber-100"
          >
            {errorMessage}
          </p>
        ) : null}
        <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent-muted p-3.5 text-sm text-accent-soft">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Kode 6 digit dikirim ke <strong className="text-content-primary">{email}</strong>.
            Kamu juga bisa membuka tautan magic link di email yang sama.
          </p>
        </div>

        <Field label="Kode verifikasi" htmlFor="otp">
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={otp}
            onChange={(event) =>
              setOtp(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))
            }
            className="h-14 text-center text-2xl font-semibold tracking-[0.5em]"
            maxLength={OTP_LENGTH}
            required
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          <KeyRound className="size-4" aria-hidden />
          Verifikasi & masuk
        </Button>

        <div className="flex items-center justify-between text-xs text-content-secondary">
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setOtp("");
            }}
            className="tap-target inline-flex items-center rounded-lg px-1 font-medium hover:text-content-primary"
          >
            Ganti email
          </button>
          <button
            type="button"
            disabled={cooldown > 0 || loading}
            onClick={() => sendOtp()}
            className="tap-target inline-flex items-center rounded-lg px-1 font-medium text-accent disabled:text-content-muted"
          >
            {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : "Kirim ulang kode"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} className="space-y-4">
      {errorMessage ? (
        <p
          role="alert"
          className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-sm leading-relaxed text-amber-100"
        >
          {errorMessage}
        </p>
      ) : null}
      <Field label="Alamat email" htmlFor="email" hint="Gunakan email aktif">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-muted" aria-hidden />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="kamu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="pl-10"
            required
          />
        </div>
      </Field>

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Kirim kode masuk
        <ArrowRight className="size-4" aria-hidden />
      </Button>

      <p className="text-center text-xs leading-relaxed text-content-muted">
        Kami mengirim kode OTP dan magic link. Tanpa password, tanpa ribet.
      </p>

      <div className="relative py-1 text-center text-[11px] uppercase tracking-wider text-content-muted">
        <span className="relative z-10 bg-ink-950 px-3">atau</span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-ink-600" aria-hidden />
      </div>

      <div className="grid gap-3 text-center text-sm">
        <p className="text-content-secondary">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Daftar gratis
          </Link>
        </p>
        <Link
          href="/reset-password"
          className="text-xs font-medium text-content-muted hover:text-content-secondary"
        >
          Lupa akses atau ingin mengatur password?
        </Link>
      </div>
    </form>
  );
}
