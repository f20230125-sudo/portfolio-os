"use client";

import { useEffect, useState } from "react";
import { motionOk } from "./motion";

export type Presence = "in" | "out" | "gone";

/**
 * Keeps something on screen for a moment after it is told to close, so it can
 * animate away: "in" while open, "out" for `ms` afterwards, then "gone".
 * With reduced motion it goes straight from "in" to "gone".
 */
export function usePresence(open: boolean, ms: number): Presence {
  const [state, setState] = useState<Presence>(open ? "in" : "gone");
  if (open && state !== "in") setState("in");
  if (!open && state === "in") setState(motionOk() ? "out" : "gone");

  useEffect(() => {
    if (state !== "out") return;
    const t = setTimeout(() => setState("gone"), ms);
    return () => clearTimeout(t);
  }, [state, ms]);

  return state;
}
