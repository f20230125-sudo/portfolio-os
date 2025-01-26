"use client";

import dynamic from "next/dynamic";
import type { WinProps } from "@/store/windowsSlice";

// Each app is loaded the first time its window opens, so the desktop itself
// starts without the assistant, the explorer or any picture.

function Loading() {
  return (
    <div className="grid h-full place-items-center text-faint" role="status">
      Opening…
    </div>
  );
}

const AskApp = dynamic(() => import("@/apps/AskApp"), { loading: Loading });
const ProjectApp = dynamic(() => import("@/apps/ProjectApp"), { loading: Loading });
const ExplorerApp = dynamic(() => import("@/apps/ExplorerApp"), { loading: Loading });
const AboutApp = dynamic(() => import("@/apps/AboutApp"), { loading: Loading });
const ResumeApp = dynamic(() => import("@/apps/ResumeApp"), { loading: Loading });
const ResearchApp = dynamic(() => import("@/apps/ResearchApp"), { loading: Loading });
const ContactApp = dynamic(() => import("@/apps/ContactApp"), { loading: Loading });
const SettingsApp = dynamic(() => import("@/apps/SettingsApp"), { loading: Loading });

export function AppView({ id, props, focusNonce }: { id: string; props: WinProps; focusNonce: number }) {
  if (id.startsWith("project:")) return <ProjectApp projectId={id.slice("project:".length)} tab={props.tab} nonce={props.nonce} />;
  switch (id) {
    case "ask":
      return <AskApp focusNonce={focusNonce} />;
    case "projects":
      return <ExplorerApp />;
    case "about":
      return <AboutApp />;
    case "resume":
      return <ResumeApp />;
    case "research":
      return <ResearchApp />;
    case "contact":
      return <ContactApp />;
    case "settings":
      return <SettingsApp />;
    default:
      return null;
  }
}
