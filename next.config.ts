import type { NextConfig } from "next";
import { projects } from "./src/knowledge/projects";

const isDev = process.env.NODE_ENV === "development";

// The sites that may be shown inside a window, taken from the project data so
// that adding a project with a live site is one edit, not two.
const origin = (url: string) => new URL(url).origin;
const frames = [...new Set(projects.flatMap((p) => (p.live ? [origin(p.live.url)] : [])))];
const microphoneSites = [...new Set(projects.flatMap((p) => (p.live?.microphone ? [origin(p.live.url)] : [])))];

// What a page of this site may load and reach. It is all its own: no scripts,
// fonts or images from another site, and no request to anywhere but itself.
// The one exception is frames, and those are the live sites of Uzair's own
// projects, named one by one. So a line of text that somehow came to be treated
// as code could not fetch a script from elsewhere or send anything out.
//
// 'unsafe-inline' is there because Next.js writes small scripts into each page
// (the data a page starts with, and the one that sets the theme before the
// first paint). Doing without it takes a fresh nonce per request, which means
// no page could be built ahead of time. What keeps a question or a project's
// text from becoming code is that it is only ever drawn as text; this policy
// is the second fence.
const contentSecurityPolicy = [
  "default-src 'self'",
  // Development needs eval for fast refresh, and a socket to hear of changes.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  `frame-src ${frames.length > 0 ? frames.join(" ") : "'none'"}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Nobody else may show this site in a frame.
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // The same, for browsers that read the older header.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The microphone is handed to Sayso's frame alone, which listens for voice requests.
  {
    key: "Permissions-Policy",
    value: `camera=(), geolocation=(), payment=(), usb=(), microphone=(self${microphoneSites.map((s) => ` "${s}"`).join("")})`,
  },
];

const nextConfig: NextConfig = {
  // Development only: lets the dev server be opened as 127.0.0.1 as well as localhost.
  allowedDevOrigins: ["127.0.0.1"],
  // The round badge Next.js draws in a corner while developing sits on top of the taskbar.
  devIndicators: false,
  // The Docker build asks for a self-contained server. Other builds, such as Vercel's, are left alone.
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The CV is a PDF, which the browser shows in its own viewer; a policy that bans plugins and
      // objects can stop that. Later rules win for the same header, so only framing is refused here.
      { source: "/cv/:path*", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'none'" }] },
    ];
  },
};

export default nextConfig;
