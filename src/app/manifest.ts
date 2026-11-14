import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CreatorChat — Ruang Kreator",
    short_name: "CreatorChat",
    description:
      "Jejaring sosial & obrolan realtime untuk kreator. Berbagi karya, diskusi, artikel, dan promosi dalam satu tempat.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0A0A0A",
    theme_color: "#FF6B00",
    categories: ["social", "communication", "productivity"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
