/** Warm the engine on intent; a failed preload can be retried by submission. */
export function preloadAssistant(): void {
  void import("@/ai/answer").catch(() => {
    // Speculative loading must not interrupt the desktop if a chunk fails to load.
  });
}
