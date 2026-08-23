import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "해랑사리우 신입 부원 모집",
    short_name: "해랑사리우 모집",
    description: "한성대학교 봉사동아리 해랑사리우 신입 부원 모집",
    start_url: "/",
    display: "standalone",
    background_color: "#f5fafc",
    theme_color: "#0a2b47",
    lang: "ko",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
