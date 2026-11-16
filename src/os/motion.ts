// Motion that CSS alone cannot do: a window has to finish leaving before the
// store forgets it, and a minimised window travels to its own taskbar button.
// Everything here does nothing (and runs at once) when the visitor asked for
// less motion, on a phone, or where the browser cannot animate.

const PHONE_WIDTH = 768;

/** True when moving things is welcome: no reduced-motion wish from the device or from Settings. */
export function motionOk(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  if (document.documentElement.dataset.reduceMotion === "true") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const winEl = (id: string) => document.querySelector<HTMLElement>(`[data-win="${id}"]`);
const taskEl = (id: string) => document.querySelector<HTMLElement>(`[data-task="${id}"]`);

/** The path between a window where it stands and its button on the taskbar. */
function taskbarFrames(el: HTMLElement, id: string): Keyframe[] {
  const w = el.getBoundingClientRect();
  const target = taskEl(id)?.getBoundingClientRect();
  const tx = target ? target.left + target.width / 2 : window.innerWidth / 2;
  const ty = target ? target.top + target.height / 2 : window.innerHeight - 24;
  const dx = tx - (w.left + w.width / 2);
  const dy = ty - (w.top + w.height / 2);
  return [
    { translate: `${w.left}px ${w.top}px`, scale: 1, opacity: 1 },
    { translate: `${w.left + dx}px ${w.top + dy}px`, scale: 0.12, opacity: 0 },
  ];
}

/**
 * Plays a window out (closing, or shrinking into the taskbar) and calls `done`
 * when it has gone. With no motion, `done` runs straight away, in the same tick.
 */
export function playLeave(id: string, kind: "close" | "minimize", done: () => void): void {
  const el = winEl(id);
  if (!el || !motionOk() || typeof el.animate !== "function" || window.innerWidth < PHONE_WIDTH || el.dataset.min === "true") {
    done();
    return;
  }
  // Already on its way out: a second click must not start again or finish twice.
  if (el.dataset.leaving) return;
  el.dataset.leaving = kind;

  const frames: Keyframe[] = kind === "close" ? [{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.94 }] : taskbarFrames(el, id);
  const animation = el.animate(frames, {
    duration: kind === "close" ? 130 : 210,
    easing: kind === "close" ? "cubic-bezier(0.4, 0, 1, 1)" : "cubic-bezier(0.5, 0, 0.9, 0.4)",
    fill: "forwards",
  });

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    delete el.dataset.leaving;
    done();
    // Let the page draw the window as hidden before the held last frame is dropped.
    requestAnimationFrame(() => requestAnimationFrame(() => animation.cancel()));
  };
  animation.onfinish = finish;
  // A tab in the background can hold an animation back; never leave a window half closed.
  setTimeout(finish, 400);
}

/** Plays a window back up out of its taskbar button. Called once it is displayed again. */
export function playRestore(el: HTMLElement, id: string): void {
  if (!motionOk() || typeof el.animate !== "function" || window.innerWidth < PHONE_WIDTH) return;
  el.animate(taskbarFrames(el, id).reverse(), { duration: 240, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
}
