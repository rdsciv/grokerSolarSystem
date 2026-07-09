import { defineConfig } from "vite";

// GitHub Pages serves from https://<user>.github.io/<repo>/
export default defineConfig({
  base: "/grokerSolarSystem/",
  server: {
    port: 5173,
    open: true,
  },
});
