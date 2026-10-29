import { project } from "@/config/project";
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
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            P<span>V</span>
          </span>
          <span>
            Private DAO
            <br />
            <strong>Voting</strong>
          </span>
        </div>
        <span className="header-caption">
          {active === "/demo"
            ? "Local group administration"
            : "Private membership, one step at a time"}
        </span>
      </header>
      <main id="main">{children}</main>
      <footer>
        <span>
          {project.author} · Team {project.team}
        </span>
        <span>MST Blockchain BUILDATHON #2</span>
      </footer>
    </>
  );
}
