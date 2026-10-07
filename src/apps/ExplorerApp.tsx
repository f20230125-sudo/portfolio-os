"use client";

import { ChevronRight, ExternalLink, Folder, LayoutGrid } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { kindLabels, projects, type Project, type ProjectKind } from "@/knowledge/projects";
import { AppIcon, GithubGlyph } from "@/os/icons";
import { useOs } from "@/os/useOs";

type Filter = "all" | ProjectKind;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All projects" },
  { id: "flagship", label: kindLabels.flagship },
  { id: "llm", label: kindLabels.llm },
  { id: "quant", label: kindLabels.quant },
  { id: "data", label: kindLabels.data },
  { id: "play", label: kindLabels.play },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const modified = (ym: string): string => {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

/** A File Explorer: categories on the left, projects as rows, details on the right. */
export default function ExplorerApp() {
  const os = useOs();
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string>("sayso");
  const listRef = useRef<HTMLUListElement>(null);

  const rows = useMemo(
    () =>
      projects
        .filter((p) => filter === "all" || p.kind === filter)
        .sort((a, b) => (a.kind === "flagship" ? 0 : 1) - (b.kind === "flagship" ? 0 : 1) || b.updated.localeCompare(a.updated) || a.name.localeCompare(b.name)),
    [filter],
  );
  const current: Project | undefined = rows.find((p) => p.id === selected) ?? rows[0];

  const onKey = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    // Start from the row that has focus, which is not always the one that is selected.
    const from = (document.activeElement as HTMLElement | null)?.dataset?.row ?? current?.id;
    const idx = rows.findIndex((p) => p.id === from);
    const next = rows[Math.min(rows.length - 1, Math.max(0, idx + (e.key === "ArrowDown" ? 1 : -1)))];
    if (!next) return;
    setSelected(next.id);
    listRef.current?.querySelector<HTMLElement>(`[data-row="${next.id}"]`)?.focus();
  };

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <nav aria-label="Project folders" className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-surface-2 p-2 md:w-[190px] md:flex-col md:overflow-visible md:border-b-0 md:border-r">
        <p className="eyebrow hidden px-2 pb-1 pt-1 md:block">Folders</p>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-surface-3 ${filter === f.id ? "bg-surface-3 font-medium" : ""}`}
          >
            {f.id === "all" ? <LayoutGrid size={15} aria-hidden="true" /> : <Folder size={15} aria-hidden="true" />}
            <span className="whitespace-nowrap">{f.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-line px-4 py-2 text-[12px] text-faint sm:grid-cols-[1fr_130px_96px]" aria-hidden="true">
          <span>Name</span>
          <span className="hidden sm:block">Type</span>
          <span className="text-right">Modified</span>
        </div>
        <ul ref={listRef} className="min-h-0 flex-1 overflow-auto p-1.5" aria-label="Projects" onKeyDown={onKey}>
          {rows.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                data-row={p.id}
                aria-current={current?.id === p.id}
                tabIndex={current?.id === p.id ? 0 : -1}
                onFocus={() => setSelected(p.id)}
                onClick={() => setSelected(p.id)}
                onDoubleClick={() => os.open(`project:${p.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    os.open(`project:${p.id}`);
                  }
                }}
                className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-md px-2.5 py-1.5 text-left sm:grid-cols-[1fr_130px_96px] ${current?.id === p.id ? "bg-accent-soft" : "hover:bg-surface-2"}`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <AppIcon icon={p.icon} size={28} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-medium">{p.name}</span>
                    <span className="block truncate text-[12px] text-faint sm:hidden">{kindLabels[p.kind]}</span>
                  </span>
                </span>
                <span className="hidden truncate text-[12.5px] text-muted sm:block">{kindLabels[p.kind]}</span>
                <span className="text-right text-[12.5px] text-muted tabular">{modified(p.updated)}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="border-t border-line px-4 py-1.5 text-[12px] text-faint" role="status">
          {rows.length} {rows.length === 1 ? "item" : "items"} · double-click or press Enter to open
        </p>
      </div>

      {current && (
        <aside aria-label={`${current.name} details`} className="hidden w-[250px] shrink-0 flex-col gap-3 overflow-auto border-l border-line bg-surface-2 p-4 lg:flex">
          <AppIcon icon={current.icon} size={64} />
          <div>
            <h3 className="text-[16px] font-semibold leading-tight">{current.name}</h3>
            <p className="mt-1 text-[12.5px] leading-snug text-muted">{current.tagline}</p>
          </div>
          <p className="text-[12px] text-faint">{current.stack.slice(0, 5).join(" · ")}</p>
          <div className="mt-auto flex flex-col gap-2">
            <button type="button" className="btn btn-primary" onClick={() => os.open(`project:${current.id}`)}>
              Open <ChevronRight size={14} aria-hidden="true" />
            </button>
            <a className="btn" href={current.code} target="_blank" rel="noopener noreferrer">
              <GithubGlyph size={14} /> Code
            </a>
            {current.live && (
              <a className="btn" href={current.live.url} target="_blank" rel="noopener noreferrer">
                Live site <ExternalLink size={13} aria-hidden="true" />
              </a>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
