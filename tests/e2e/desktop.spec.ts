import { expect, test } from "@playwright/test";
import { boxOf, DESKTOP_ICONS, drag, gotoDesktop, icon, openIcon, watchConsole, win } from "./helpers";

test.describe("the desktop", () => {
  test("opens with the assistant up and every icon on the desktop", async ({ page }) => {
    const errors = watchConsole(page);
    await gotoDesktop(page);
    await expect(win(page, "Ask Uzair")).toBeVisible();
    for (const name of DESKTOP_ICONS) await expect(icon(page, name)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Mohammad Uzair Khan");
    await expect(page.getByRole("navigation", { name: "Taskbar" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("shows his four apps first, as the first column of icons", async ({ page }) => {
    await gotoDesktop(page);
    const names = await page.getByRole("option").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
    expect(names.slice(0, 4)).toEqual(["Agent Desk, project", "Flowboard, project", "Sayso, project", "Hindsight, project"]);
  });

  for (const name of DESKTOP_ICONS) {
    test(`double-clicking ${name} opens it`, async ({ page }) => {
      const errors = watchConsole(page);
      await gotoDesktop(page);
      const w = await openIcon(page, name);
      await expect(w.locator(".win-body")).not.toBeEmpty();
      await expect(page.getByRole("button", { name: new RegExp(`^${name}, open`) })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test("a link can open a window straight away", async ({ page }) => {
    await gotoDesktop(page, "?open=sayso");
    await expect(win(page, "Sayso")).toBeVisible();
    await expect(win(page, "Ask Uzair")).toHaveCount(0);
    await gotoDesktop(page, "?open=nonsense");
    await expect(win(page, "Ask Uzair")).toBeVisible();
  });

  test("the theme switch changes the whole desktop and is remembered", async ({ page }) => {
    await gotoDesktop(page);
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("the taskbar clock shows Dubai time", async ({ page }) => {
    await gotoDesktop(page);
    const clock = page.getByRole("timer");
    await expect(clock).toHaveAttribute("aria-label", /Dubai time \d\d:\d\d/);
  });
});

test.describe("windows", () => {
  test("move when their title bar is dragged", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "About");
    const before = await boxOf(w);
    const title = await boxOf(w.locator(".win-title"));
    await drag(page, { x: title.x + 200, y: title.y + 18 }, { x: title.x + 120, y: title.y + 98 });
    await expect.poll(async () => Math.round((await boxOf(w)).x - before.x)).toBe(-80);
    expect(Math.round((await boxOf(w)).y - before.y)).toBe(80);
    expect(Math.round((await boxOf(w)).width)).toBe(Math.round(before.width));
  });

  test("cannot be dragged out of reach", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "About");
    const title = await boxOf(w.locator(".win-title"));
    const start = await boxOf(w);
    await drag(page, { x: title.x + 300, y: title.y + 18 }, { x: 600, y: 2000 });
    const vp = page.viewportSize()!;
    await expect.poll(async () => (await boxOf(w)).y).toBeGreaterThan(start.y + 100);
    expect((await boxOf(w)).y).toBeLessThan(vp.height - 48);
  });

  test("resize from a corner and from an edge, and stop at a minimum size", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "Contact");
    const before = await boxOf(w);
    await drag(page, { x: before.x + before.width - 3, y: before.y + before.height - 3 }, { x: before.x + before.width + 77, y: before.y + before.height + 57 });
    await expect.poll(async () => Math.round((await boxOf(w)).width - before.width)).toBe(80);
    const grown = await boxOf(w);
    expect(Math.round(grown.height - before.height)).toBe(60);
    await drag(page, { x: grown.x + 2, y: grown.y + grown.height / 2 }, { x: grown.x + 2000, y: grown.y + grown.height / 2 });
    await expect.poll(async () => Math.round((await boxOf(w)).width)).toBe(320);
    const small = await boxOf(w);
    expect(Math.round(small.x + small.width)).toBe(Math.round(grown.x + grown.width));
  });

  test("minimise hides a window and its taskbar button brings it back", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "About");
    await page.getByRole("button", { name: "Minimise About" }).click();
    await expect(w).toBeHidden();
    const task = page.getByRole("button", { name: "About, minimised" });
    await expect(task).toBeVisible();
    await task.click();
    await expect(w).toBeVisible();
  });

  test("a taskbar button hides the window in front and shows it again", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "About");
    await page.getByRole("button", { name: "About, open" }).click();
    await expect(w).toBeHidden();
    await page.getByRole("button", { name: "About, minimised" }).click();
    await expect(w).toBeVisible();
  });

  test("maximise fills the screen above the taskbar, and restore puts it back", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "Resume");
    const before = await boxOf(w);
    await page.getByRole("button", { name: "Maximise Resume" }).click();
    const vp = page.viewportSize()!;
    await expect.poll(async () => Math.round((await boxOf(w)).width)).toBe(vp.width);
    expect(Math.round((await boxOf(w)).height)).toBe(vp.height - 48);
    await page.getByRole("button", { name: "Restore Resume" }).click();
    await expect.poll(async () => Math.round((await boxOf(w)).width)).toBe(Math.round(before.width));
    expect(Math.round((await boxOf(w)).x)).toBe(Math.round(before.x));
  });

  test("double-clicking the title bar maximises", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "Resume");
    const title = await boxOf(w.locator(".win-title"));
    await page.mouse.dblclick(title.x + 150, title.y + 18);
    await expect(page.getByRole("button", { name: "Restore Resume" })).toBeVisible();
  });

  test("snap to the left half by dragging to the edge, and show the outline on the way", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "About");
    const title = await boxOf(w.locator(".win-title"));
    await page.mouse.move(title.x + 200, title.y + 18);
    await page.mouse.down();
    await page.mouse.move(title.x + 100, title.y + 100, { steps: 4 });
    await page.mouse.move(2, 300, { steps: 6 });
    await expect(page.locator(".snap-preview")).toBeVisible();
    await page.mouse.up();
    await expect(page.locator(".snap-preview")).toHaveCount(0);
    const vp = page.viewportSize()!;
    await expect.poll(async () => Math.round((await boxOf(w)).width)).toBe(Math.floor(vp.width / 2));
    const snapped = await boxOf(w);
    expect(Math.round(snapped.x)).toBe(0);
    expect(Math.round(snapped.height)).toBe(vp.height - 48);
  });

  test("a snapped window comes loose when pulled by its title bar", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "About");
    const original = await boxOf(w);
    let title = await boxOf(w.locator(".win-title"));
    await drag(page, { x: title.x + 200, y: title.y + 18 }, { x: 1, y: 300 });
    const vp = page.viewportSize()!;
    await expect.poll(async () => Math.round((await boxOf(w)).height)).toBe(vp.height - 48);
    title = await boxOf(w.locator(".win-title"));
    await drag(page, { x: title.x + 100, y: title.y + 18 }, { x: 600, y: 200 });
    // It gets its old size back, and sits where it was let go.
    await expect.poll(async () => Math.round((await boxOf(w)).height)).toBe(Math.round(original.height));
    expect(Math.round((await boxOf(w)).width)).toBe(Math.round(original.width));
  });

  test("the one clicked comes to the front", async ({ page }) => {
    await gotoDesktop(page);
    const about = await openIcon(page, "About");
    const contact = await openIcon(page, "Contact");
    const z = (l: typeof about) => l.evaluate((el) => Number(getComputedStyle(el).zIndex));
    await expect.poll(async () => (await z(contact)) > (await z(about))).toBe(true);
    await about.locator(".win-title").click({ position: { x: 100, y: 10 } });
    await expect.poll(async () => (await z(about)) > (await z(contact))).toBe(true);
    await expect(about).toHaveAttribute("data-focused", "true");
    await expect(contact).toHaveAttribute("data-focused", "false");
  });

  test("close removes the window and its taskbar button, if it was not pinned", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "Sayso");
    await expect(page.getByRole("button", { name: "Sayso, open" })).toBeVisible();
    await page.getByRole("button", { name: "Close Sayso" }).click();
    await expect(w).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Sayso/ })).toHaveCount(0);
  });

  test("opening an open window again does not make a second one", async ({ page }) => {
    await gotoDesktop(page);
    await openIcon(page, "About");
    await icon(page, "About").dblclick();
    await expect(page.getByRole("dialog", { name: "About", exact: true })).toHaveCount(1);
  });

  test("show desktop hides everything and a second press brings it back", async ({ page }) => {
    await gotoDesktop(page);
    await openIcon(page, "About");
    await page.getByRole("button", { name: "Show desktop" }).click();
    await expect(page.getByRole("dialog", { name: "About", exact: true })).toBeHidden();
    await expect(win(page, "Ask Uzair")).toBeHidden();
    await page.getByRole("button", { name: "Show desktop" }).click();
    await expect(page.getByRole("dialog", { name: "About", exact: true })).toBeVisible();
  });

  test("scale back to fit when the browser window shrinks", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "Resume");
    await page.getByRole("button", { name: "Maximise Resume" }).click();
    await page.setViewportSize({ width: 1000, height: 700 });
    await expect.poll(async () => Math.round((await boxOf(w)).width)).toBe(1000);
    expect(Math.round((await boxOf(w)).height)).toBe(700 - 48);
  });
});

test.describe("by keyboard", () => {
  test("arrow keys move between icons, Enter opens one", async ({ page }) => {
    await gotoDesktop(page);
    await icon(page, "Agent Desk").focus();
    await page.keyboard.press("ArrowDown");
    await expect(icon(page, "Flowboard")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(icon(page, "Sayso")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(icon(page, "Resume")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(icon(page, "Sayso")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(win(page, "Sayso")).toBeVisible();
  });

  test("Alt and the arrow keys move the window that has focus, and Alt+Shift resizes it", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "About");
    await w.focus();
    const before = await boxOf(w);
    await page.keyboard.press("Alt+ArrowRight");
    await page.keyboard.press("Alt+ArrowDown");
    await expect.poll(async () => Math.round((await boxOf(w)).x - before.x)).toBe(24);
    await expect.poll(async () => Math.round((await boxOf(w)).y - before.y)).toBe(24);
    const moved = await boxOf(w);
    await page.keyboard.press("Alt+Shift+ArrowRight");
    await expect.poll(async () => Math.round((await boxOf(w)).width - moved.width)).toBe(24);
  });

  test("a window opened from the keyboard takes focus", async ({ page }) => {
    await gotoDesktop(page);
    await icon(page, "Contact").focus();
    await page.keyboard.press("Enter");
    await expect(win(page, "Contact")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.closest("[role=dialog]")?.getAttribute("aria-label"))).toBe("Contact");
  });

  test("every control has a name a screen reader can say", async ({ page }) => {
    await gotoDesktop(page);
    await openIcon(page, "Sayso");
    const unnamed = await page.getByRole("button").evaluateAll((els) => els.filter((e) => !(e.getAttribute("aria-label") || e.textContent?.trim() || e.getAttribute("title"))).length);
    expect(unnamed).toBe(0);
  });
});

test.describe("right-click menus", () => {
  test("an icon offers open, live site, code and ask", async ({ page }) => {
    await gotoDesktop(page);
    await icon(page, "Sayso").click({ button: "right" });
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem")).toHaveText([/Open$/, /Open live site in a new tab/, /View code on GitHub/, /Ask about Sayso/]);
    await menu.getByRole("menuitem", { name: /^Ask about Sayso/ }).click();
    await expect(win(page, "Ask Uzair")).toBeVisible();
    await expect(page.getByText("Tell me about Sayso").first()).toBeVisible();
  });

  test("the desktop offers its own menu, and Escape closes it", async ({ page }) => {
    await gotoDesktop(page);
    await page.mouse.click(700, 500, { button: "right" });
    await expect(page.getByRole("menu").getByRole("menuitem", { name: "Settings" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("arrow keys move through a menu", async ({ page }) => {
    await gotoDesktop(page);
    await icon(page, "Sayso").click({ button: "right" });
    const items = page.getByRole("menuitem");
    await expect(items.first()).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(items.first()).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(win(page, "Sayso")).toBeVisible();
  });
});

test.describe("Start and search", () => {
  test("Start opens with the pinned apps and closes with Escape", async ({ page }) => {
    await gotoDesktop(page);
    await page.getByRole("button", { name: "Start" }).click();
    const start = page.getByRole("dialog", { name: "Start menu" });
    await expect(start).toBeVisible();
    await expect(start.getByRole("button", { name: "Flowboard" }).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(start).toHaveCount(0);
  });

  test("clicking a pinned app opens it and closes Start", async ({ page }) => {
    await gotoDesktop(page);
    await page.getByRole("button", { name: "Start" }).click();
    await page.getByRole("dialog", { name: "Start menu" }).getByRole("button", { name: "Research" }).click();
    await expect(win(page, "Research")).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Start menu" })).toHaveCount(0);
  });

  test("clicking outside closes it", async ({ page }) => {
    await gotoDesktop(page);
    await page.getByRole("button", { name: "Start" }).click();
    await page.mouse.click(400, 200);
    await expect(page.getByRole("dialog", { name: "Start menu" })).toHaveCount(0);
  });

  test("search finds a project by what it is built with, and Enter opens the first result", async ({ page }) => {
    await gotoDesktop(page);
    await page.getByRole("button", { name: "Start" }).click();
    await page.getByLabel("Search apps and projects, or ask a question").fill("react flow");
    await expect(page.getByRole("list", { name: "Results" }).getByRole("button").first()).toContainText("Flowboard");
    await page.keyboard.press("Enter");
    await expect(win(page, "Flowboard")).toBeVisible();
  });

  test("a search that matches nothing offers to ask the assistant", async ({ page }) => {
    await gotoDesktop(page);
    await page.getByRole("button", { name: "Start" }).click();
    await page.getByLabel("Search apps and projects, or ask a question").fill("does he know kubernetes");
    await page.keyboard.press("Enter");
    await expect(win(page, "Ask Uzair")).toBeVisible();
    await expect(page.getByText("Kubernetes is on his CV").first()).toBeVisible();
  });

  test("the taskbar search box asks a question", async ({ page }) => {
    await gotoDesktop(page);
    await page.getByLabel("Ask anything about Uzair").fill("where did he work");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Amaani").first()).toBeVisible();
  });
});

test.describe("the simple view", () => {
  test("is a plain page with every project, and a way back", async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto("/simple");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mohammad Uzair Khan");
    for (const name of ["Agent Desk", "Flowboard", "Sayso", "Hindsight", "Quant Copilot", "AI Trading Copilot", "AI Market Analyst", "Document Q&A Agent", "Ticket Triage Agent", "PR Diff Summarizer", "Support-Triage Pipeline", "Property Data Warehouse", "Noodle", "Pokémon Aurora"]) {
      await expect(page.getByRole("heading", { name, level: 3 })).toBeVisible();
    }
    await page.getByRole("link", { name: "Open the desktop version" }).click();
    await expect(page.getByRole("listbox", { name: "Desktop" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("lists exactly the projects the desktop can open", async ({ page, browser }) => {
    await page.goto("/simple");
    const simple = await page.getByRole("heading", { level: 3 }).allTextContents();
    const fromSimple = simple.filter((t) => !["Earlier builds", "Certifications"].includes(t) && !/^(Lightweight|Backend Developer|BITS)/.test(t));
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const desk = await ctx.newPage();
    await gotoDesktop(desk);
    await openIcon(desk, "Projects");
    const projectRows = win(desk, "Projects").getByRole("list", { name: "Projects" }).getByRole("button");
    await expect(projectRows).toHaveCount(14);
    const rows = await projectRows.evaluateAll((els) => els.map((e) => e.querySelector("span.font-medium")?.textContent ?? ""));
    await ctx.close();
    expect([...rows].sort()).toEqual([...fromSimple].sort());
    expect(rows).toHaveLength(14);
  });

  test("works with scripts off, and the desktop says where to go instead", async ({ browser, request }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/simple");
    await expect(page.getByRole("heading", { name: "Sayso", level: 3 })).toBeVisible();
    await ctx.close();
    const html = await (await request.get("/")).text();
    expect(html).toContain("This desktop needs JavaScript");
    expect(html).toContain('href="/simple"');
  });
});
