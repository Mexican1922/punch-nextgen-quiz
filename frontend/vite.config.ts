import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Fixed port: the backend CORS allowlist names 5173, so a silent fallback
  // to another port would break every API call with a confusing error.
  server: { port: 5173, strictPort: true },
});
