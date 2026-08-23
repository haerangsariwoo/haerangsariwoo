import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "해랑사리우",
    short_name: "해랑사리우",
    description: "한성대학교 봉사동아리 해랑사리우 회원 웹앱",
    start_url: "/home",
    display: "standalone",
    background_color: "#f3f9fd",
    theme_color: "#148cd6",
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
