import { Download, Mail } from "lucide-react";
import { education, person } from "@/knowledge/profile";
import { GithubGlyph, LinkedinGlyph, Mark } from "./icons";

/**
 * Who this is, on the desktop itself, so the first screen says it before
 * anything is opened. A plain section with real links: it is drawn on the
 * server too, so a search engine reads it, and it sits behind every window.
 */
export function ProfileCard() {
  const u = education.university;
  return (
    <section className="profile-card" aria-labelledby="profile-name">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 flex-none place-items-center rounded-xl text-white" style={{ background: "linear-gradient(145deg, #1d4ed8, #7c3aed)" }} aria-hidden="true">
          <Mark size={26} />
        </span>
        <div className="min-w-0">
          <h2 id="profile-name" className="text-[18px] font-semibold leading-tight" data-selectable>{person.name}</h2>
          <p className="text-[13px] text-muted" data-selectable>{person.role} · {person.location}</p>
        </div>
      </div>
      <p className="profile-about mt-3 text-[13.5px] leading-snug" data-selectable>
        {person.tagline} {u.degree}, BITS Pilani Dubai, expected {u.expected}. First-author paper submitted to IEEE MSN 2026.
      </p>
      <p className="profile-status" data-selectable>{person.status}</p>
      <div className="mt-3 grid gap-2">
        <a className="btn btn-primary" href={person.cv.url} download>
          <Download size={14} aria-hidden="true" /> {person.cv.label}
        </a>
        <div className="grid grid-cols-3 gap-2">
          <a className="btn !px-2" href={`mailto:${person.email}`}>
            <Mail size={14} aria-hidden="true" /> Email
          </a>
          <a className="btn !px-2" href={person.github} target="_blank" rel="noopener noreferrer">
            <GithubGlyph size={14} /> GitHub
          </a>
          <a className="btn !px-2" href={person.linkedin} target="_blank" rel="noopener noreferrer">
            <LinkedinGlyph size={14} /> LinkedIn
          </a>
        </div>
      </div>
    </section>
  );
}
