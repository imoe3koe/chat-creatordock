import type { Metadata } from "next";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { RegisterForm } from "@/modules/auth/components/register-form";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun CreatorChat gratis dengan verifikasi email.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Buat ruang karyamu"
      subtitle="Gratis, tanpa kartu kredit. Verifikasi email dengan OTP atau magic link."
    >
      <RegisterForm />
    </AuthShell>
  );
}
