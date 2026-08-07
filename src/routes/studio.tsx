import { createFileRoute } from "@tanstack/react-router";
import Studio from "@/pages/Studio";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Profile Hub Studio — ROUT" },
      {
        name: "description",
        content:
          "Build your sovereign link-in-bio: components, themes, subdomain, DID verification and analytics.",
      },
      { property: "og:title", content: "Profile Hub Studio — ROUT" },
      { property: "og:description", content: "Build your sovereign link-in-bio page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Studio,
});
