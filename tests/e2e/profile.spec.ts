import { expect, test, type Locator, type Page } from "@playwright/test";
import { gotoDesktop, icon, openIcon, win, watchConsole, DESKTOP_ICONS } from "./helpers";

// The card on the desktop that says who this is, and the CV it offers. What a
// visitor sees before opening anything has to hold on every size of screen.

const CV = "/cv/Mohammad-Uzair-Khan-CV.pdf";
const card = (page: Page): Locator => page.getByRole("region", { name: "Mohammad Uzair Khan" });

type Box = { x: number; y: number; width: number; height: number };
const box = async (l: Locator): Promise<Box> => {
  const b = await l.boundingBox();
  if (!b) throw new Error("not on screen");
  return b;
};
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** Boxes of every desktop icon. */
async function iconBoxes(page: Page): Promise<Box[]> {
  return Promise.all(DESKTOP_ICONS.map((n) => box(icon(page, n))));
}

test.describe("on a wide screen", () => {
  test("says who he is before anything is opened", async ({ page }) => {
    const errors = watchConsole(page);
    await gotoDesktop(page);
    const c = card(page);
    await expect(c).toBeVisible();
    await expect(c.getByRole("heading", { name: "Mohammad Uzair Khan" })).toBeVisible();
    await expect(c).toContainText("Software & AI engineer");
    await expect(c).toContainText("Dubai, UAE");
    await expect(c).toContainText("Open to work in Dubai: on-site, hybrid or remote");
    expect(errors).toEqual([]);
  });

  test("offers the CV, email, GitHub and LinkedIn as real links", async ({ page }) => {
    await gotoDesktop(page);
    const c = card(page);
    const cv = c.getByRole("link", { name: "Download CV (PDF)" });
    await expect(cv).toHaveAttribute("href", CV);
    await expect(cv).toHaveAttribute("download", "");
    await expect(c.getByRole("link", { name: "Email" })).toHaveAttribute("href", /^mailto:/);
    await expect(c.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", /^https:\/\/github\.com\//);
    await expect(c.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", /^https:\/\/www\.linkedin\.com\//);
  });

  test("the CV file is a PDF the browser may show, and does not carry what he keeps private", async ({ page, request }) => {
    await gotoDesktop(page);
    const res = await request.get(CV);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/pdf");
    // Only framing is refused: a policy that bans objects can stop the browser's own PDF viewer.
    expect(res.headers()["content-security-policy"]).toBe("frame-ancestors 'none'");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    const body = await res.body();
    expect(body.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    // A real click downloads it.
    const [download] = await Promise.all([page.waitForEvent("download"), card(page).getByRole("link", { name: "Download CV (PDF)" }).click()]);
    expect(download.suggestedFilename()).toBe("Mohammad-Uzair-Khan-CV.pdf");
  });

  test("sits beside the icons and clear of the assistant, and every window covers it", async ({ page }) => {
    await gotoDesktop(page);
    const ask = win(page, "Ask Uzair");
    await expect(ask).toBeVisible();
    const c = await box(card(page));
    const a = await box(ask);
    for (const i of await iconBoxes(page)) expect(overlaps(c, i)).toBe(false);
    expect(overlaps(c, a)).toBe(false);

    // About opens over part of the card: at that point the window is what is on top.
    await openIcon(page, "About");
    const about = await box(win(page, "About"));
    const x = Math.max(c.x, about.x) + 20;
    const y = Math.max(c.y, about.y) + 20;
    expect(x).toBeLessThan(Math.min(c.x + c.width, about.x + about.width));
    expect(y).toBeLessThan(Math.min(c.y + c.height, about.y + about.height));
    const top = await page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.closest("[role=dialog]")?.getAttribute("aria-label") ?? null, [x, y]);
    expect(top).toBe("About");
  });

  test("is in the page the server sends, for search engines and for visitors without scripts", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toContain("Mohammad Uzair Khan");
    expect(html).toContain("Open to work in Dubai");
    expect(html).toContain(CV);
    expect(html).toMatch(/<link rel="canonical" href="https?:\/\/[^"/]+"/);
  });
});

test.describe("on a narrower screen", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("shows the card and leaves the assistant to be opened, so nothing is covered", async ({ page }) => {
    await gotoDesktop(page);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const c = await box(card(page));
    expect(c.x).toBeGreaterThanOrEqual(192);
    expect(c.x + c.width).toBeLessThanOrEqual(1024);
    for (const i of await iconBoxes(page)) expect(overlaps(c, i)).toBe(false);
    // The assistant is one click away, in the taskbar.
    await page.getByRole("button", { name: "Ask Uzair" }).click();
    await expect(win(page, "Ask Uzair")).toBeVisible();
  });
});

for (const [name, width, height] of [
  ["a phone", 390, 844],
  ["a small phone", 375, 667],
] as const) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: { width, height }, hasTouch: true, isMobile: true });

    test("shows the card under the icons, above the taskbar, inside the screen", async ({ page }) => {
      await gotoDesktop(page);
      const cardEl = card(page);
      await expect(cardEl).toBeVisible();
      await expect(cardEl.getByRole("link", { name: "Download CV (PDF)" })).toBeVisible();
      const c = await box(cardEl);
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.x + c.width).toBeLessThanOrEqual(width);
      expect(c.y + c.height).toBeLessThanOrEqual(height - 48);
      for (const i of await iconBoxes(page)) expect(overlaps(c, i)).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    });

    test("a window opened from an icon covers it", async ({ page }) => {
      await gotoDesktop(page);
      await icon(page, "About").tap();
      await expect(win(page, "About")).toBeVisible();
      const c = await box(card(page));
      const top = await page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.closest("[role=dialog]")?.getAttribute("aria-label") ?? null, [c.x + c.width / 2, c.y + c.height / 2]);
      expect(top).toBe("About");
    });
  });
}

test.describe("the CV from everywhere else", () => {
  test("the assistant hands it over when asked, with the button first", async ({ page }) => {
    await gotoDesktop(page);
    const log = page.getByRole("log");
    await page.getByLabel("Ask a question about Uzair").fill("Can I download his CV?");
    await page.keyboard.press("Enter");
    const link = log.getByRole("link", { name: "Download CV (PDF)" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", CV);
    await expect(log.getByText("phone number and grades")).toBeVisible();
  });

  test("the Resume and Contact windows offer it, and Contact shows its whole form without scrolling", async ({ page }) => {
    await gotoDesktop(page);
    const resume = await openIcon(page, "Resume");
    await expect(resume.getByRole("link", { name: "Download CV (PDF)" })).toHaveAttribute("href", CV);
    await resume.getByRole("button", { name: "Close Resume" }).click();

    const contact = await openIcon(page, "Contact");
    await expect(contact.getByRole("link", { name: "Download CV (PDF)" })).toHaveAttribute("href", CV);
    const w = await box(contact);
    const send = await box(contact.getByRole("link", { name: "Open in my email app" }));
    const linkedin = await box(contact.getByRole("link", { name: "LinkedIn" }));
    expect(send.y + send.height).toBeLessThanOrEqual(w.y + w.height);
    expect(linkedin.y + linkedin.height).toBeLessThanOrEqual(w.y + w.height);
  });

  test("the simple view offers it too", async ({ page }) => {
    await page.goto("/simple");
    await expect(page.getByRole("link", { name: "Download CV (PDF)" })).toHaveAttribute("href", CV);
    await expect(page.getByText("Open to work in Dubai: on-site, hybrid or remote.")).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/simple$/);
  });

  test("About speaks in one voice and does not cite LinkedIn on his own page", async ({ page }) => {
    await gotoDesktop(page);
    const about = await openIcon(page, "About");
    await expect(about).not.toContainText("I build");
    await expect(about).not.toContainText("per his LinkedIn");
    await expect(about).toContainText("Open to work in Dubai: on-site, hybrid or remote");
  });
});
