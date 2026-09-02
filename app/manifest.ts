import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chordify Hymnal",
    short_name: "Chordify",
    description: "Photograph a hymnal page and get guitar chords.",
    start_url: "/",
    display: "standalone",
    background_color: "#12100e",
    theme_color: "#12100e",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
