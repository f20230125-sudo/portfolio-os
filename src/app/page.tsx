import { person } from "@/knowledge/profile";
import { Os } from "@/os/Os";

// Who this page is about, in the form search engines read.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: person.name,
  jobTitle: person.role,
  description: person.summary,
  email: person.email,
  address: { "@type": "PostalAddress", addressLocality: "Dubai", addressCountry: "AE" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "BITS Pilani, Dubai Campus" },
  sameAs: [person.github, person.linkedin],
};

export default function Home() {
  return (
    <main>
      <h1 className="sr-only">{person.name}, {person.role.toLowerCase()}. This page is a desktop: open the icons to see his projects.</h1>
      <Os />
      <noscript>
        <p style={{ position: "fixed", inset: "auto 0 56px 0", textAlign: "center", color: "#fff", background: "rgba(0,0,0,.7)", padding: 12 }}>
          This desktop needs JavaScript. <a href="/simple" style={{ color: "#9ad1ff" }}>Open the simple view</a> instead.
        </p>
      </noscript>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
    </main>
  );
}
