tsx
import Link from "next/link";
import Image from "next/image"; // Tambahkan import Image
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("focus-ring inline-flex items-center gap-2.5 rounded-lg", className)}
      aria-label="CreatorChat — Beranda"
    >
      {/* 
         Ganti span lama dengan container Image. 
         Ukuran size-9 (36px) dipertahankan agar layout tidak berantakan.
      */}
      <div className="relative size-9 overflow-hidden rounded-xl shadow-[0_4px_20px_rgba(255,107,0,0.15)]">
        <Image
          src="public/icons/logo-chatcreator-01.png" // Simpan file logo Anda di folder /public/logo.png
          alt="logo-chatcreator"
          fill
          className="object-contain" // Memastikan gambar proporsional
          sizes="36px"
          priority // Memuat logo lebih cepat (LCP)
        />
      </div>

      {!compact ? (
        <span className="text-[17px] font-bold tracking-tight text-content-primary">
          Creator<span className="text-accent">Chat</span>
        </span>
      ) : null}
    </Link>
  );
}
