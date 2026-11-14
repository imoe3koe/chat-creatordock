"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      toast.success("Kamu sudah keluar.");
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Gagal keluar. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={signOut}
        disabled={loading}
        className="tap-target grid size-11 place-items-center rounded-xl text-content-secondary transition hover:bg-white/[0.06] hover:text-content-primary"
        aria-label="Keluar dari akun"
        title="Keluar"
      >
        <LogOut className="size-4.5" />
      </button>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={signOut} loading={loading} className="w-full justify-start">
      <LogOut className="size-4" aria-hidden />
      Keluar
    </Button>
  );
}
