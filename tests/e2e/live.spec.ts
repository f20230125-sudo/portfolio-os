import { expect, test, type Page } from "@playwright/test";
import { boxOf, drag, gotoDesktop, icon, openIcon, win } from "./helpers";

// The Live tab shows the real app inside its window. These tests never reach
// the real sites: each address is answered here with a stand-in page, so the
// tests prove the window's side of it (when the frame loads, what it is allowed
// to do, that it does not break dragging) and never depend on the internet.

const APPS = [
  { icon: "Agent Desk", url: "https://github-bot-wine.vercel.app", microphone: false },
  { icon: "Flowboard", url: "https://flowboard-flax-seven.vercel.app", microphone: false },
  { icon: "Sayso", url: "https://sayso-sigma.vercel.app", microphone: true },
  { icon: "Hindsight", url: "https://hindsight-sand.vercel.app", microphone: false },
] as const;

/** Answers every live site with a small page that says whose it is, and counts the requests. */
async function stubSites(page: Page): Promise<{ hits: string[] }> {
  const hits: string[] = [];
  await page.route(/^https:\/\/(github-bot-wine|flowboard-flax-seven|sayso-sigma|hindsight-sand)\.vercel\.app\/.*/, (route) => {
    const host = new URL(route.request().url()).hostname;
    hits.push(host);
    return route.fulfill({ status: 200, contentType: "text/html", body: `<!doctype html><title>stand-in</title><h1>Stand-in for ${host}</h1><button>Press me</button>` });
  });
  await page.route(/^https:\/\/f20230125-sudo\.github\.io\/.*/, (route) => {
    hits.push("noodle");
    return route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>stand-in</title><h1>Stand-in for Noodle</h1>" });
  });
  return { hits };
}

for (const app of APPS) {
  test.describe(app.icon, () => {
    test("loads the real app only when asked, inside a sandboxed frame", async ({ page }) => {
      const { hits } = await stubSites(page);
      await gotoDesktop(page);
      const w = await openIcon(page, app.icon);
      await w.getByRole("tab", { name: "Live" }).click();
      // Nothing is fetched until the visitor says so.
      await expect(w.locator("iframe")).toHaveCount(0);
      expect(hits).toEqual([]);

      await w.getByRole("button", { name: "Run it here" }).click();
      const frame = w.locator("iframe");
      await expect(frame).toHaveAttribute("title", `${app.icon}, running live`);
      await expect(frame).toHaveAttribute("src", app.url);
      await expect(page.frameLocator(`iframe[title="${app.icon}, running live"]`).getByRole("heading")).toContainText(new URL(app.url).hostname);

      const sandbox = (await frame.getAttribute("sandbox")) ?? "";
      for (const token of ["allow-scripts", "allow-same-origin", "allow-forms", "allow-popups", "allow-popups-to-escape-sandbox"]) expect(sandbox).toContain(token);
      // Nothing that would let it navigate the portfolio away or take over the top page.
      expect(sandbox).not.toContain("allow-top-navigation");
      expect(sandbox).not.toContain("allow-modals");
      expect(await frame.getAttribute("referrerpolicy")).toBe("strict-origin-when-cross-origin");
      // Only Sayso, which listens for voice, is handed the microphone.
      if (app.microphone) await expect(frame).toHaveAttribute("allow", "microphone");
      else await expect(frame).not.toHaveAttribute("allow", /.+/);
    });

    test("always offers the way out: a new tab", async ({ page }) => {
      await stubSites(page);
      await gotoDesktop(page);
      const w = await openIcon(page, app.icon);
      await w.getByRole("tab", { name: "Live" }).click();
      await w.getByRole("button", { name: "Run it here" }).click();
      const out = w.getByRole("link", { name: /New tab/ });
      await expect(out).toHaveAttribute("href", app.url);
      await expect(out).toHaveAttribute("target", "_blank");
      await expect(out).toHaveAttribute("rel", /noopener/);
      await expect(w.getByText("Blank or stuck?")).toBeVisible();
    });

    test("the Reload button loads it again", async ({ page }) => {
      const { hits } = await stubSites(page);
      await gotoDesktop(page);
      const w = await openIcon(page, app.icon);
      await w.getByRole("tab", { name: "Live" }).click();
      await w.getByRole("button", { name: "Run it here" }).click();
      await expect.poll(() => hits.length).toBe(1);
      await w.getByRole("button", { name: `Reload ${app.icon}` }).click();
      await expect.poll(() => hits.length).toBe(2);
    });
  });
}

test.describe("with a live frame open", () => {
  test("the window can still be dragged by its title bar", async ({ page }) => {
    await stubSites(page);
    await gotoDesktop(page);
    const w = await openIcon(page, "Sayso");
    await w.getByRole("tab", { name: "Live" }).click();
    await w.getByRole("button", { name: "Run it here" }).click();
    await expect(page.frameLocator('iframe[title="Sayso, running live"]').getByRole("heading")).toBeVisible();
    const before = await boxOf(w);
    const title = await boxOf(w.locator(".win-title"));
    // The pointer ends up over the frame; the page must not lose the drag to it.
    await drag(page, { x: title.x + 300, y: title.y + 18 }, { x: title.x + 200, y: title.y + 300 });
    await expect.poll(async () => Math.round((await boxOf(w)).x - before.x)).toBe(-100);
    expect(Math.round((await boxOf(w)).y - before.y)).toBe(282);
  });

  test("a window behind another does not hand its first click to the app inside", async ({ page }) => {
    await stubSites(page);
    await gotoDesktop(page);
    const sayso = await openIcon(page, "Sayso");
    await sayso.getByRole("tab", { name: "Live" }).click();
    await sayso.getByRole("button", { name: "Run it here" }).click();
    const frame = sayso.locator("iframe");
    await expect(frame).toHaveCSS("pointer-events", "auto");
    // Another window comes forward: the frame behind it is covered, so a click lands on the window, not in the app.
    await openIcon(page, "About");
    await expect(frame).toHaveCSS("pointer-events", "none");
    await sayso.locator(".win-title").click({ position: { x: 120, y: 10 } });
    await expect(sayso).toHaveAttribute("data-focused", "true");
    await expect(frame).toHaveCSS("pointer-events", "auto");
  });

  test("while a window is being dragged, frames let go of the pointer", async ({ page }) => {
    await stubSites(page);
    await gotoDesktop(page);
    const w = await openIcon(page, "Sayso");
    await w.getByRole("tab", { name: "Live" }).click();
    await w.getByRole("button", { name: "Run it here" }).click();
    const frame = w.locator("iframe");
    const title = await boxOf(w.locator(".win-title"));
    await page.mouse.move(title.x + 300, title.y + 18);
    await page.mouse.down();
    await page.mouse.move(title.x + 250, title.y + 120, { steps: 5 });
    await expect(frame).toHaveCSS("pointer-events", "none");
    await page.mouse.up();
    await expect(frame).toHaveCSS("pointer-events", "auto");
  });

  test("closing the window removes the app and its frame", async ({ page }) => {
    await stubSites(page);
    await gotoDesktop(page);
    const w = await openIcon(page, "Hindsight");
    await w.getByRole("tab", { name: "Live" }).click();
    await w.getByRole("button", { name: "Run it here" }).click();
    await expect(page.locator("iframe")).toHaveCount(1);
    await page.getByRole("button", { name: "Close Hindsight" }).click();
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("minimising keeps the app loaded, so it is where it was when the window comes back", async ({ page }) => {
    const { hits } = await stubSites(page);
    await gotoDesktop(page);
    const w = await openIcon(page, "Flowboard");
    await w.getByRole("tab", { name: "Live" }).click();
    await w.getByRole("button", { name: "Run it here" }).click();
    await expect.poll(() => hits.length).toBe(1);
    await page.getByRole("button", { name: "Minimise Flowboard" }).click();
    await page.getByRole("button", { name: "Flowboard, minimised" }).click();
    await expect(w.locator("iframe")).toBeVisible();
    expect(hits.length).toBe(1);
  });
});

test.describe("a link", () => {
  test("can open a project straight on its Live tab, or on its overview", async ({ page }) => {
    await stubSites(page);
    await gotoDesktop(page, "?open=sayso&tab=live");
    const w = win(page, "Sayso");
    await expect(w.getByRole("tab", { name: "Live", selected: true })).toBeVisible();
    await gotoDesktop(page, "?open=sayso");
    await expect(win(page, "Sayso").getByRole("tab", { name: "Overview", selected: true })).toBeVisible();
  });

  test("an answer's button opens the project; the live tab is one click further", async ({ page }) => {
    await stubSites(page);
    await gotoDesktop(page);
    await page.getByLabel("Ask a question about Uzair").fill("Can I try Flowboard?");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Run it here" }).click();
    const w = win(page, "Flowboard");
    await expect(w).toBeVisible();
    await expect(w.getByRole("tab", { name: "Live", selected: true })).toBeVisible();
  });
});

test.describe("Noodle runs from GitHub Pages", () => {
  test("is shown in its window like the others", async ({ page }) => {
    const { hits } = await stubSites(page);
    await gotoDesktop(page);
    await openIcon(page, "Projects");
    await win(page, "Projects").getByRole("button", { name: /^Noodle/ }).dblclick();
    const w = win(page, "Noodle");
    await w.getByRole("tab", { name: "Live" }).click();
    await w.getByRole("button", { name: "Run it here" }).click();
    await expect(page.frameLocator('iframe[title="Noodle, running live"]').getByRole("heading")).toContainText("Noodle");
    expect(hits).toContain("noodle");
  });
});

test("a project with no live site never makes a frame", async ({ page }) => {
  await gotoDesktop(page);
  await openIcon(page, "Projects");
  await win(page, "Projects").getByRole("button", { name: /^Quant Copilot/ }).dblclick();
  const w = win(page, "Quant Copilot");
  await expect(w.getByRole("tab", { name: "Live" })).toHaveCount(0);
  await expect(page.locator("iframe")).toHaveCount(0);
  await icon(page, "Sayso").focus();
});
