"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { sanitizeEmail } from "@/lib/security/sanitize";
import { checkClientRateLimit } from "@/lib/security/rate-limit";

export function ResetRequestForm() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) {
      toast.error("Masukkan email yang valid.");
      return;
    }

    const limit = checkClientRateLimit("auth:reset", { limit: 3, windowMs: 120_000 });
    if (!limit.allowed) {
      toast.error("Terlalu banyak permintaan. Tunggu beberapa menit.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password/update`,
      });

      if (error) {
        toast.error("Permintaan reset gagal. Coba lagi nanti.");
        return;
      }

      setSent(true);
      toast.success("Jika email terdaftar, tautan reset sudah dikirim.");
    } catch {
      toast.error("Supabase belum dikonfigurasi atau koneksi gagal.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5">
          <Send className="size-5 text-emerald-300" aria-hidden />
          <h2 className="mt-3 text-sm font-semibold text-emerald-100">Periksa email kamu</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-emerald-100/80">
            Kami mengirim tautan untuk mengatur ulang password ke{" "}
            <strong className="text-emerald-50">{email}</strong>. Tautan berlaku
            terbatas, jadi segera gunakan.
          </p>
        </div>
        <Button variant="secondary" className="w-full" onClick={() => setSent(false)}>
          Kirim ke email lain
        </Button>
        <p className="text-center text-sm text-content-secondary">
          Sudah reset?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Alamat email" htmlFor="email">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-muted" aria-hidden />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="kamu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="pl-10"
            required
          />
        </div>
      </Field>

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Kirim tautan reset
      </Button>

      <p className="text-center text-sm text-content-secondary">
        Ingat password?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Kembali masuk
        </Link>
      </p>
    </form>
  );
}
