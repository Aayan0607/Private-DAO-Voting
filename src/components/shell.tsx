import Link from "next/link";
import { project } from "@/config/project";
const links = [
  { href: "/", label: "Overview" },
  { href: "/membership", label: "Membership" },
  { href: "/proposals", label: "Proposals" },
];
export function Shell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: string;
}) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Private DAO Voting home">
          <span className="brand-icon" aria-hidden="true">
            P<span>V</span>
          </span>
          <span>
            Private DAO
            <br />
            <strong>Voting</strong>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <span className="status">
          <i aria-hidden="true" />
          {project.mode}
        </span>
      </header>
      <main id="main">{children}</main>
      <footer>
        <span>
          Built by {project.author} · Team {project.team}
        </span>
        <span>MST Blockchain BUILDATHON #2</span>
      </footer>
    </>
  );
}
