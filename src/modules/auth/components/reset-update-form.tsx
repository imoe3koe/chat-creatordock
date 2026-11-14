"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetUpdateForm() {
  const router = useRouter();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password minimal 8 karakter.");
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      toast.error("Gunakan kombinasi huruf dan angka.");
      return;
    }
    if (password !== confirm) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(
          error.message.toLowerCase().includes("session")
            ? "Sesi reset sudah kedaluwarsa. Minta tautan baru."
            : "Password gagal diperbarui. Coba lagi.",
        );
        return;
      }

      toast.success("Password berhasil diperbarui.");
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Supabase belum dikonfigurasi atau koneksi gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Password baru" htmlFor="password" hint="Min. 8 karakter">
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-content-muted" aria-hidden />
          <Input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="pl-10 pr-11"
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setShow((value) => !value)}
            className="tap-target absolute right-0 top-0 grid place-items-center rounded-lg text-content-muted hover:text-content-primary"
            aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <Field label="Konfirmasi password" htmlFor="confirm">
        <Input
          id="confirm"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          minLength={8}
          required
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Simpan password baru
      </Button>

      <p className="text-center text-xs text-content-muted">
        Setelah disimpan, kamu akan diarahkan ke beranda.{" "}
        <Link href="/login" className="text-accent hover:underline">
          Masuk manual
        </Link>
      </p>
    </form>
  );
}
