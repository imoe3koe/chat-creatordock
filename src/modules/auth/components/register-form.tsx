"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AtSign, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  sanitizeEmail,
  sanitizeSingleLine,
  sanitizeUsername,
} from "@/lib/security/sanitize";
import { checkClientRateLimit } from "@/lib/security/rate-limit";

const OTP_LENGTH = 6;

export function RegisterForm() {
  const router = useRouter();
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"details" | "otp">("details");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function validate():
    | { error: string }
    | { cleanName: string; cleanUsername: string; cleanEmail: string } {
    const cleanName = sanitizeSingleLine(fullName, 100);
    const cleanUsername = sanitizeUsername(username);
    const cleanEmail = sanitizeEmail(email);

    if (cleanName.length < 2) return { error: "Nama minimal 2 karakter." };
    if (cleanUsername.length < 3) return { error: "Username minimal 3 karakter (huruf, angka, underscore)." };
    if (!cleanEmail) return { error: "Masukkan email yang valid." };
    return { cleanName, cleanUsername, cleanEmail };
  }

  async function sendOtp(event?: React.FormEvent) {
    event?.preventDefault();
    const values = validate();
    if ("error" in values) {
      toast.error(values.error);
      return;
    }

    const limit = checkClientRateLimit("auth:register", {
      limit: 4,
      windowMs: 60_000,
    });
    if (!limit.allowed) {
      toast.error("Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();

      const { data: usernameAvailable, error: usernameError } = await supabase
        .rpc("is_username_available", { p_username: values.cleanUsername });

      if (usernameError) {
        // The helper may not be deployed yet; the signup trigger still resolves
        // collisions, so continue instead of blocking registration.
        console.warn("[register] username check unavailable:", usernameError.message);
      } else if (usernameAvailable === false) {
        toast.error("Username sudah dipakai. Coba username lain.");
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: values.cleanEmail,
        options: {
          shouldCreateUser: true,
          data: {
            username: values.cleanUsername,
            full_name: values.cleanName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });

      if (error) {
        toast.error(
          error.message.toLowerCase().includes("already")
            ? "Email sudah terdaftar. Silakan masuk."
            : "Pendaftaran gagal dikirim. Coba lagi.",
        );
        return;
      }

      setStep("otp");
      setCooldown(60);
      toast.success("Kode verifikasi dikirim. Cek email kamu.");
    } catch {
      toast.error("Supabase belum dikonfigurasi atau koneksi gagal.");
    } finally {
      setLoading(false);
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    const token = otp.replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (token.length !== OTP_LENGTH || !email) {
      toast.error("Masukkan 6 digit kode dari email.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.verifyOtp({
        email: sanitizeEmail(email),
        token,
        type: "email",
      });

      if (error) {
        toast.error("Kode salah atau kedaluwarsa. Minta kode baru.");
        return;
      }

      toast.success("Akun berhasil dibuat. Selamat bergabung!");
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Verifikasi gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={verify} className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent-muted p-3.5 text-sm text-accent-soft">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Kode 6 digit dikirim ke <strong className="text-content-primary">{email}</strong>.
            Setelah verifikasi, profil @{sanitizeUsername(username)} langsung dibuat.
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
          Verifikasi & buat akun
        </Button>

        <div className="flex items-center justify-between text-xs text-content-secondary">
          <button
            type="button"
            onClick={() => setStep("details")}
            className="tap-target rounded-lg font-medium hover:text-content-primary"
          >
            Ubah data
          </button>
          <button
            type="button"
            disabled={cooldown > 0 || loading}
            onClick={() => sendOtp()}
            className="tap-target font-medium text-accent disabled:text-content-muted"
          >
            {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : "Kirim ulang kode"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} className="space-y-4">
      <Field label="Nama lengkap" htmlFor="name">
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-muted" aria-hidden />
          <Input
            id="name"
            autoComplete="name"
            placeholder="Nama tampilan kamu"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="pl-10"
            maxLength={100}
            required
          />
        </div>
      </Field>

      <Field label="Username" htmlFor="username" hint="Huruf kecil, angka, _" >
        <div className="relative">
          <AtSign className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-muted" aria-hidden />
          <Input
            id="username"
            autoComplete="username"
            placeholder="namakreatif"
            value={username}
            onChange={(event) => setUsername(sanitizeUsername(event.target.value))}
            className="pl-10"
            maxLength={30}
            required
          />
        </div>
      </Field>

      <Field label="Alamat email" htmlFor="email">
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
        Buat akun gratis
      </Button>

      <p className="text-center text-xs leading-relaxed text-content-muted">
        Kami akan mengirim kode OTP & magic link untuk memverifikasi emailmu.
      </p>

      <p className="text-center text-sm text-content-secondary">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}
