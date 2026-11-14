import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { ResetUpdateForm } from "@/modules/auth/components/reset-update-form";
import { getCurrentUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Password Baru",
  description: "Buat password baru untuk akun CreatorChat.",
  robots: { index: false, follow: false },
};

export default async function ResetUpdatePage() {
  const user = await getCurrentUser();

  return (
    <AuthShell
      title="Password baru"
      subtitle="Gunakan kombinasi huruf dan angka. Minimal 8 karakter."
    >
      {user ? (
        <ResetUpdateForm />
      ) : (
        <div className="space-y-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-sm text-amber-100">
          <p className="font-semibold">Sesi reset tidak ditemukan.</p>
          <p className="leading-relaxed text-amber-100/80">
            Tautan mungkin sudah kedaluwarsa atau dibuka di perangkat lain. Minta
            tautan reset baru untuk melanjutkan.
          </p>
          <Link href="/reset-password">
            <Button variant="secondary" className="w-full">
              Minta tautan baru
            </Button>
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
