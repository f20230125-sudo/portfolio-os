"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { windowsActions } from "@/store/windowsSlice";

/** Below this width the desktop becomes a phone: one full-screen window at a time. */
export const PHONE_WIDTH = 768;

/** Keeps the store told how big the screen is. */
export function useViewport(): void {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const report = () => dispatch(windowsActions.setViewport({ w: window.innerWidth, h: window.innerHeight }));
    report();
    window.addEventListener("resize", report);
    window.addEventListener("orientationchange", report);
    return () => {
      window.removeEventListener("resize", report);
      window.removeEventListener("orientationchange", report);
    };
  }, [dispatch]);
}
