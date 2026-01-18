import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
    outDir: "output",
    modules: ["@wxt-dev/module-react"],
    manifest: {
        permissions: ["sidePanel", "storage", "audioCapture"],
        action: {},
        name: "Baize",
        description: "AI-powered browser agent",
    },
});
