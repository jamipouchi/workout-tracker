import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  server: {
    compatibilityDate: "2024-09-19",
    preset: "cloudflare-module",
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
    prerender: {
      crawlLinks: true,
      routes: ["/", "/log", "/view", "/404"],
    },
  },
});
