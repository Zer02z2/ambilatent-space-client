import { resolve } from "path"
import { defineConfig } from "vite"

export default defineConfig({
  server: {
    port: 5173,
  },
  root: resolve(__dirname, "src"),
  publicDir: resolve(__dirname, "public"),
  base: "/ambilatent-space-client/",
  build: {
    outDir: "../docs",
  },
})
