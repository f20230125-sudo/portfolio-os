"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// Right-click menus. One menu is open at a time; it closes when anything else
// is clicked, when Escape is pressed, or when an item is chosen.

export type MenuItem = { label: string; onSelect: () => void; icon?: React.ReactNode } | { separator: true };

interface Shown {
  x: number;
  y: number;
  items: MenuItem[];
  /** The element to give focus back to when the menu closes. */
  returnTo: HTMLElement | null;
}

interface MenuApi {
  show: (at: { x: number; y: number }, items: MenuItem[]) => void;
}

const MenuContext = createContext<MenuApi | null>(null);

export function useContextMenu(): MenuApi {
  const api = useContext(MenuContext);
  if (!api) throw new Error("useContextMenu must be used inside <ContextMenuProvider>.");
  return api;
}

export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [shown, setShown] = useState<Shown | null>(null);
  const show = useCallback((at: { x: number; y: number }, items: MenuItem[]) => {
    setShown({ ...at, items, returnTo: document.activeElement instanceof HTMLElement ? document.activeElement : null });
  }, []);
  const api = useMemo(() => ({ show }), [show]);
  const close = useCallback(() => {
    setShown((s) => {
      s?.returnTo?.focus({ preventScroll: true });
      return null;
    });
  }, []);

  return (
    <MenuContext.Provider value={api}>
      {children}
      {shown && <Menu shown={shown} onClose={close} />}
    </MenuContext.Provider>
  );
}

const MENU_W = 230;

function Menu({ shown, onClose }: { shown: Shown; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const count = shown.items.filter((i) => !("separator" in i)).length;
  const height = count * 32 + (shown.items.length - count) * 9 + 8;
  const x = Math.max(4, Math.min(shown.x, window.innerWidth - MENU_W - 4));
  const y = Math.max(4, Math.min(shown.y, window.innerHeight - height - 56));

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const blur = () => onClose();
    document.addEventListener("pointerdown", away, true);
    window.addEventListener("blur", blur);
    window.addEventListener("resize", blur);
    return () => {
      document.removeEventListener("pointerdown", away, true);
      window.removeEventListener("blur", blur);
      window.removeEventListener("resize", blur);
    };
  }, [onClose]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const buttons = [...(ref.current?.querySelectorAll<HTMLElement>("button") ?? [])];
    const i = buttons.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      buttons[(i + 1) % buttons.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      buttons[(i - 1 + buttons.length) % buttons.length]?.focus();
    } else if (e.key === "Tab") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div ref={ref} className="menu" role="menu" style={{ left: x, top: y, width: MENU_W }} onKeyDown={onKeyDown} onContextMenu={(e) => e.preventDefault()}>
      {shown.items.map((item, i) =>
        "separator" in item ? (
          <hr key={`sep-${i}`} role="separator" />
        ) : (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            onClick={() => {
              // Close first so focus returns to where it was, then act (an action may move focus on).
              onClose();
              item.onSelect();
            }}
          >
            {item.icon ? <span className="grid w-4 place-items-center text-muted">{item.icon}</span> : <span className="w-4" />}
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}
