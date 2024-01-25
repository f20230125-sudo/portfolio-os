"use client";

import { useMemo } from "react";
import { useAppDispatch } from "@/store/hooks";
import { askAbout, openApp } from "./actions";

/** What an app inside a window can ask the shell to do. */
export function useOs() {
  const dispatch = useAppDispatch();
  return useMemo(
    () => ({
      open: (id: string, tab?: string) => dispatch(openApp(id, tab ? { tab } : undefined)),
      ask: (question: string) => dispatch(askAbout(question)),
    }),
    [dispatch],
  );
}
