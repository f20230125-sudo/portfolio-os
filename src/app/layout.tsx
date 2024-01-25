import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import { THEME_SCRIPT } from "@/components/themeScript";
import { person } from "@/knowledge/profile";
import "./globals.css";

const TITLE = `${person.name} · ${person.role}`;
const DESCRIPTION =
  "A portfolio built as a desktop. Open Uzair Khan's projects in windows, run his live apps inside them, and ask the assistant anything about him. BITS Pilani Dubai, building LLM agents, front-end interfaces for AI and edge ML.";

// On Vercel this is the site's public address, which link previews need.
const SITE = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3050";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: TITLE, template: `%s · ${person.short} Khan` },
  description: DESCRIPTION,
  authors: [{ name: person.name, url: person.github }],
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", siteName: person.name },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f3f3" },
    { media: "(prefers-color-scheme: dark)", color: "#202020" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The script below sets data-theme before React loads, so the attribute
    // differs from what the server sent. That is expected.
    <html lang="en" data-theme="light" suppressHydrationWarning className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
