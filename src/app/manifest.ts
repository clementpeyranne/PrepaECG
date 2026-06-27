import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prepa ECG OS",
    short_name: "Prepa ECG",
    description: "L'application de travail quotidien pour les preparationnaires ECG.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1720",
    theme_color: "#14221d",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
