import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CreatorChat — Ruang Kreator",
    template: "%s · CreatorChat",
  },
  description:
    "Jejaring sosial & obrolan realtime untuk kreator. Berbagi karya, diskusi, artikel, dan promosi dalam satu ruang yang tenang.",
  applicationName: "CreatorChat",
  authors: [{ name: "CreatorChat" }],
  keywords: [
    "creatorchat",
    "jejaring sosial kreator",
    "obrolan realtime",
    "ruang diskusi",
    "galeri kreator",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CreatorChat",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "CreatorChat",
    title: "CreatorChat — Ruang Kreator",
    description:
      "Berbagi karya, berdiskusi, menyimpan artikel, dan mempromosikan karyamu — dalam satu ruang.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CreatorChat — Ruang Kreator",
    description:
      "Berbagi karya, berdiskusi, menyimpan artikel, dan mempromosikan karyamu.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="dark">
      <body className="bg-ink-950 font-sans text-content-primary antialiased">
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-md bg-accent px-4 py-2 text-sm font-semibold text-ink-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Lompat ke konten
        </a>
        <ToastProvider>{children}</ToastProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
