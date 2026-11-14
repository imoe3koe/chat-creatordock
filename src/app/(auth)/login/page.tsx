import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { LoginForm } from "@/modules/auth/components/login-form";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke CreatorChat dengan kode OTP atau magic link.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Selamat datang kembali"
      subtitle="Masuk tanpa password. Kami kirim kode OTP dan magic link langsung ke emailmu."
    >
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-ink-800" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
