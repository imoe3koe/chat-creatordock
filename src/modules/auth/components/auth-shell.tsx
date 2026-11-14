import Link from "next/link";
import { ArrowLeft, Quote, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main
      id="main-content"
      className="relative flex min-h-dvh flex-col bg-ink-950 lg:grid lg:grid-cols-[1.05fr_1fr]"
    >
      <section className="relative hidden overflow-hidden border-r border-ink-600 bg-ink-900 p-10 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div
          className="pointer-events-none absolute -right-32 top-1/4 size-[480px] rounded-full bg-accent/15 blur-[120px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-24 bottom-0 size-[320px] rounded-full bg-orange-700/10 blur-[100px]"
          aria-hidden
        />

        <Logo />

        <div className="relative max-w-lg">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-muted px-3 py-1.5 text-xs font-semibold text-accent-soft">
            <Sparkles className="size-3.5" aria-hidden />
            Ruang kreator, tanpa distraksi
          </span>
          <h2 className="text-balance text-4xl font-bold leading-[1.15] tracking-tight xl:text-5xl">
            Satu tempat untuk{" "}
            <span className="gradient-text">berkarya dan terhubung.</span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-content-secondary">
            Berbagi obrolan, foto, dokumen, dan ide. Simpan bacaan favorit,
            bangun ruang diskusi privat, dan tampilkan karyamu — semuanya dalam
            satu ruang gelap yang tenang.
          </p>

          <div className="mt-10 rounded-2xl border border-ink-600 bg-ink-800/70 p-5 backdrop-blur">
            <Quote className="size-5 text-accent" aria-hidden />
            <p className="mt-3 text-sm leading-relaxed text-content-secondary">
              “Komunitas kreator tidak butuh lebih banyak noise. Mereka butuh
              ruang yang membuat karya terasa layak diperhatikan.”
            </p>
            <p className="mt-3 text-xs font-medium text-content-muted">
              — Filosofi CreatorChat
            </p>
          </div>
        </div>

        <p className="relative text-xs text-content-muted">
          © {new Date().getFullYear()} CreatorChat. Dibuat untuk kreator.
        </p>
      </section>

      <section className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-ink-600 px-4 py-3 lg:hidden">
          <Logo />
          <Link
            href="/p/tentang-kami"
            className="tap-target inline-flex items-center rounded-lg px-3 text-xs font-medium text-content-secondary hover:text-content-primary"
          >
            Tentang
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-md animate-fade-up">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-content-muted transition hover:text-content-primary"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Kembali
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-content-secondary">
              {subtitle}
            </p>
            <div className="mt-7">{children}</div>
            {footer ? <div className="mt-6 text-sm text-content-secondary">{footer}</div> : null}
          </div>
        </div>

        <footer className="px-6 py-5 text-center text-[11px] text-content-muted lg:text-right">
          Dengan melanjutkan, kamu menyetujui{" "}
          <Link href="/p/syarat-ketentuan" className="underline hover:text-content-secondary">
            Syarat & Ketentuan
          </Link>{" "}
          dan{" "}
          <Link href="/p/kebijakan-privasi" className="underline hover:text-content-secondary">
            Kebijakan Privasi
          </Link>
          .
        </footer>
      </section>
    </main>
  );
}
