import type { Metadata } from "next";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { ResetRequestForm } from "@/modules/auth/components/reset-request-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Atur ulang password akun CreatorChat melalui email.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Atur ulang akses"
      subtitle="Masukkan email akunmu. Kami kirim tautan aman untuk membuat password baru."
    >
      <ResetRequestForm />
    </AuthShell>
  );
}
