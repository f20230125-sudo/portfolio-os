import { defineConfig, devices } from "@playwright/test";

// Choose a separate port when the usual development port is already occupied.
const port = process.env.PLAYWRIGHT_PORT ?? "3050";
const baseURL = `http://localhost:${port}`;

// End-to-end tests drive the real site in a real browser. Locally they use the
// dev server (and reuse one that is already running); in CI they run against
// the production build.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Many windows open at once against one server make pages late, not wrong.
  workers: process.env.CI ? 2 : 6,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    // The taskbar clock shows Dubai time. One fixed zone keeps a test the same
    // on a laptop in Dubai and on a CI machine in UTC.
    timezoneId: "Asia/Dubai",
    // Windows ease in over a fraction of a second; a test that measures one
    // while it is moving would measure the animation. The site honours this setting.
    reducedMotion: "reduce",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `node node_modules/next/dist/bin/next ${process.env.CI ? "start" : "dev"} -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
