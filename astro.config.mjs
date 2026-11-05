// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://prismatic-labs.github.io",
  base: "/marigold",
  compressHTML: true,
  devToolbar: { enabled: false },
  integrations: [sitemap()],
});
