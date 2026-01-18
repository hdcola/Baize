import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  outDir: "output",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    permissions: ["sidePanel", "storage", "audioCapture", "tabs"],
    action: {},
    name: "MatePI",
    description: "AI-powered browser agent",
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; img-src 'self' blob: data:",
    },
  },
});
