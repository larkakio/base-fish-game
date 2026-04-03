import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wagmiConnectorsEsm = path.resolve(
  __dirname,
  "node_modules/@wagmi/connectors/dist/esm"
);

export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@fish-wagmi/baseAccount": path.join(wagmiConnectorsEsm, "baseAccount.js"),
      "@fish-wagmi/walletConnect": path.join(wagmiConnectorsEsm, "walletConnect.js"),
    },
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  server: {
    port: 3000,
    host: true,
  },
  optimizeDeps: {
    include: ['phaser'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
});
