"use client";

import { Check, Copy, Download, Mail } from "lucide-react";
import { useState } from "react";
import { person } from "@/knowledge/profile";
import { GithubGlyph, LinkedinGlyph } from "@/os/icons";

export default function ContactApp() {
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(person.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be refused; the address is on screen to select.
    }
  };

  // No server is involved: this builds an email in the visitor's own mail program.
  const href = `mailto:${person.email}?subject=${encodeURIComponent(subject || "Hello from your portfolio")}&body=${encodeURIComponent(body)}`;

  return (
    <div className="mx-auto max-w-[520px] space-y-5 p-6">
      <header>
        <h2 className="text-[20px] font-semibold">Get in touch</h2>
        <p className="mt-1 text-[14px] leading-relaxed text-muted">He is open to work in Dubai, on-site, hybrid or remote. Email is the quickest way to reach him.</p>
      </header>

      <div className="panel flex items-center gap-3 p-3">
        <Mail size={18} className="shrink-0 text-faint" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate font-mono text-[13.5px]" data-selectable>{person.email}</span>
        <button type="button" className="btn !min-h-8" onClick={copy} aria-live="polite">
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <p className="eyebrow">Write him a note</p>
        <label className="block text-[13px]">
          <span className="mb-1 block text-muted">Subject</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} placeholder="Hello from your portfolio" className="h-9 w-full rounded-md border border-line-strong bg-surface px-3 text-[14px] outline-none focus:border-accent" />
        </label>
        <label className="block text-[13px]">
          <span className="mb-1 block text-muted">Message</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={1500} className="w-full resize-none rounded-md border border-line-strong bg-surface p-3 text-[14px] outline-none focus:border-accent" />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <a className="btn btn-primary" href={href}>
            <Mail size={14} aria-hidden="true" /> Open in my email app
          </a>
          <p className="text-[12px] text-faint">Nothing is sent from this page; your own email app does it.</p>
        </div>
      </form>

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <a className="btn" href={person.cv.url} download>
          <Download size={14} aria-hidden="true" /> {person.cv.label}
        </a>
        <a className="btn" href={person.linkedin} target="_blank" rel="noopener noreferrer">
          <LinkedinGlyph size={14} /> LinkedIn
        </a>
        <a className="btn" href={person.github} target="_blank" rel="noopener noreferrer">
          <GithubGlyph size={14} /> GitHub
        </a>
      </div>
    </div>
  );
}
