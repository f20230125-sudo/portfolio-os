"use client";

import type { ReactNode } from "react";
import { useOs } from "./useOs";

/** The interactive part of the server-rendered featured panel. */
export function OpenAppButton({ app, children }: { app: string; children: ReactNode }) {
  const os = useOs();
  return <button type="button" onClick={() => os.open(app)}>{children}</button>;
}
