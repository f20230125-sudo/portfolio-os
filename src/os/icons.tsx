import {
  Bot,
  ChartCandlestick,
  ChartGantt,
  ChartLine,
  CookingPot,
  Database,
  FileSearch,
  FileText,
  FlaskConical,
  FolderOpen,
  Gamepad2,
  GitPullRequest,
  ListChecks,
  Mail,
  PlaneTakeoff,
  Settings,
  Sparkles,
  Ticket,
  TrendingUp,
  UserRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { IconSpec } from "@/knowledge/schema";

// The pictures on icon tiles. Only the icons used are imported, so the rest of
// the library is not shipped.
const GLYPHS: Record<string, LucideIcon> = {
  Bot,
  ChartCandlestick,
  ChartGantt,
  ChartLine,
  CookingPot,
  Database,
  FileSearch,
  FileText,
  FlaskConical,
  FolderOpen,
  Gamepad2,
  GitPullRequest,
  ListChecks,
  Mail,
  PlaneTakeoff,
  Settings,
  Sparkles,
  Ticket,
  TrendingUp,
  UserRound,
  Workflow,
};

/** A rounded tile with a gradient and a white glyph: what an app or project looks like. */
export function AppIcon({ icon, size = 48 }: { icon: IconSpec; size?: number }) {
  const Glyph = GLYPHS[icon.glyph] ?? Sparkles;
  return (
    <span
      className="tile"
      aria-hidden="true"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.24), background: `linear-gradient(145deg, ${icon.from}, ${icon.to})` }}
    >
      <Glyph size={Math.round(size * 0.52)} strokeWidth={1.7} />
    </span>
  );
}

/** Uzair's own mark: a triangle inside a triangle. It is the Start button. */
export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-2 -2 36 36" aria-hidden="true">
      <path d="M16 1 29 23.5H3z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M16 9.5 21.5 19h-11z" fill="currentColor" />
    </svg>
  );
}

export function GithubGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function LinkedinGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}
