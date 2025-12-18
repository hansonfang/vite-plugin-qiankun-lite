import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import qiankun from "@hansonfang/vite-plugin-qiankun-lite";
import checker from "vite-plugin-checker";
import { name } from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        checker({
            typescript: true,
            vueTsc: true,
        }),
        qiankun({ name, sandbox: !!process.env.VITE_SANDBOX }),
    ],
    server: {
        cors: true,
        origin: "*",
    },
});
