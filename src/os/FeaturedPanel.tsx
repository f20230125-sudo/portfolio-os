import Image from "next/image";
import { featured } from "@/knowledge/projects";
import { OpenAppButton } from "./OpenAppButton";

/** Plain server-rendered content; only the window-opening buttons need JavaScript. */
export function FeaturedPanel() {
  return (
    <section className="featured-panel" aria-labelledby="featured-heading">
      <h2 id="featured-heading">Featured work</h2>
      <ul className="featured-list">
        {featured.map((p, i) => (
          <li key={p.id} data-featured={p.id}>
            <span className="featured-shot">
              <Image src={p.shots[0].src} alt={p.shots[0].alt} width={192} height={120} sizes="192px" loading={i === 0 ? "eager" : "lazy"} />
            </span>
            <div className="featured-copy">
              <h3>{p.name}</h3>
              <p className="featured-tagline" data-selectable>{p.tagline}</p>
              <div className="featured-actions">
                <OpenAppButton app={`project:${p.id}`}>Open</OpenAppButton>
                <a href={p.live!.url} target="_blank" rel="noopener noreferrer">Live site</a>
                <a href={p.code} target="_blank" rel="noopener noreferrer">Code</a>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="featured-all"><OpenAppButton app="projects">All projects</OpenAppButton></div>
    </section>
  );
}
