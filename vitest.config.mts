import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// The clock on the taskbar and "as of" dates depend on the time zone. The site
// is Dubai's, so tests run on Dubai time wherever they run: a laptop there, or
// a CI machine on UTC. The end-to-end tests do the same (see playwright.config.ts).
process.env.TZ = "Asia/Dubai";

export default defineConfig({
  plugins: [react()],
  // Read the "@/..." import alias from tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    // The assistant and the window maths need no browser. A component test asks
    // for one itself with a `// @vitest-environment jsdom` line at the top.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
