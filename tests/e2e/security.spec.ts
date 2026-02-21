import { expect, test } from "@playwright/test";

// What every page is sent with. The policy names no site except the live sites
// of Uzair's own projects, and only for frames.

test.describe("security headers", () => {
  test("every page forbids being framed, sniffed and leaking its address", async ({ request }) => {
    for (const path of ["/", "/simple", "/api/health"]) {
      const r = await request.get(path);
      const h = r.headers();
      expect(h["x-frame-options"], path).toBe("DENY");
      expect(h["x-content-type-options"], path).toBe("nosniff");
      expect(h["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
      expect(h["content-security-policy"], path).toContain("frame-ancestors 'none'");
    }
  });

  test("the policy loads nothing from another site, and names exactly the sites that may be framed", async ({ request }) => {
    const csp = (await request.get("/")).headers()["content-security-policy"];
    const directive = (name: string) => csp.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${name} `)) ?? "";
    expect(directive("default-src")).toBe("default-src 'self'");
    expect(directive("img-src")).not.toMatch(/https?:/);
    expect(directive("font-src")).toBe("font-src 'self'");
    expect(directive("object-src")).toBe("object-src 'none'");
    expect(directive("base-uri")).toBe("base-uri 'self'");
    expect(directive("script-src")).not.toMatch(/https?:/);
    expect(directive("connect-src")).not.toMatch(/https?:/);
    const frames = directive("frame-src").split(" ").slice(1).sort();
    expect(frames).toEqual(
      [
        "https://flowboard-flax-seven.vercel.app",
        "https://github-bot-wine.vercel.app",
        "https://hindsight-sand.vercel.app",
        "https://sayso-sigma.vercel.app",
      ].sort(),
    );
  });

  test("only Sayso's frame is handed the microphone", async ({ request }) => {
    const policy = (await request.get("/")).headers()["permissions-policy"];
    expect(policy).toContain('microphone=(self "https://sayso-sigma.vercel.app")');
    expect(policy).toContain("camera=()");
    expect(policy).toContain("geolocation=()");
  });

  test("the page makes no request to another site", async ({ page }) => {
    const foreign: string[] = [];
    page.on("request", (r) => {
      const u = new URL(r.url());
      if (u.protocol.startsWith("http") && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") foreign.push(r.url());
    });
    await page.goto("/");
    await page.getByRole("listbox", { name: "Desktop" }).waitFor();
    await page.getByLabel("Ask a question about Uzair").fill("Tell me about Sayso");
    await page.keyboard.press("Enter");
    await page.getByText("How I answered").waitFor();
    expect(foreign).toEqual([]);
  });
});

test.describe("the site's own pages", () => {
  test("have a title, a description and a link preview", async ({ request }) => {
    for (const path of ["/", "/simple"]) {
      const html = await (await request.get(path)).text();
      expect(html, path).toMatch(/<title>[^<]*Uzair[^<]*<\/title>/);
      expect(html, path).toMatch(/<meta name="description" content="[^"]{40,}/);
      expect(html, path).toContain('property="og:title"');
      expect(html, path).toContain('property="og:image"');
    }
  });

  test("the home page tells search engines who it is about", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toContain('"@type":"Person"');
    expect(html).toContain("Mohammad Uzair Khan");
  });

  test("the health route answers, and robots and the sitemap exist", async ({ request }) => {
    expect(await (await request.get("/api/health")).json()).toEqual({ ok: true });
    expect((await request.get("/robots.txt")).status()).toBe(200);
    expect(await (await request.get("/sitemap.xml")).text()).toContain("/simple");
  });
});
