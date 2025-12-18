import qiankun from "@hansonfang/vite-plugin-qiankun-lite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import { name } from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), qiankun({ name, sandbox: !!process.env.VITE_SANDBOX })],
  server: {
    cors: true,
    origin: "*",
  },
});
