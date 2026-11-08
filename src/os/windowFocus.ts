// DOM elements belong here, never in the serialisable window state.
const openers = new Map<string, HTMLElement>();

export function rememberOpener(id: string): void {
  if (typeof document === "undefined") return;
  const el = document.activeElement;
  if (!(el instanceof HTMLElement) || el === document.body || el.closest("[data-win]")?.getAttribute("data-win") === id) return;
  openers.set(id, el);
}

export function restoreOpener(id: string, topId: string | null): void {
  const opener = openers.get(id);
  openers.delete(id);
  const top = [...document.querySelectorAll<HTMLElement>("[data-win]")].find((el) => el.dataset.win === topId);
  const selected = document.querySelector<HTMLElement>('[data-icon][aria-selected="true"]')
    ?? document.querySelector<HTMLElement>('[data-icon][tabindex="0"]');
  for (const el of [opener, top, selected]) {
    if (!el?.isConnected || !el.getClientRects().length || el.closest('[data-min="true"]') || el.matches(":disabled")) continue;
    el.focus({ preventScroll: true });
    if (document.activeElement === el) return;
  }
}
