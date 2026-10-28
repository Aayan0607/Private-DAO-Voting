import Link from "next/link";
import { Shell } from "@/components/shell";
import { modules } from "@/config/project";
export default function Home() {
  return (
    <Shell active="/">
      <section className="hero">
        <div>
          <p className="eyebrow">A voice in the DAO. A choice of your own.</p>
          <h1>
            Your vote counts.
            <br />
            <em>Your identity stays yours.</em>
          </h1>
          <p className="lead">
            We are building a way for approved members to vote without publicly
            linking their membership to their ballot.
          </p>
          <div className="actions">
            <Link className="button primary" href="/membership">
              Explore membership <span aria-hidden="true">↗</span>
            </Link>
            <Link className="button secondary" href="/proposals">
              View proposal preview
            </Link>
          </div>
          <p className="stage-note">
            Foundation preview · Proof generation and on-chain voting are not
            connected yet.
          </p>
        </div>
        <div
          className="flow-card"
          aria-label="Planned workflow: approved members create a private proof; a relay sends it to the contract; the contract records a public result."
        >
          <div className="card-heading">
            <span className="eyebrow">How it will work</span>
            <span className="tag">Planned flow</span>
          </div>
          <div className="member-nodes" aria-hidden="true">
            <span>A</span>
            <span>B</span>
            <span>C</span>
            <span>D</span>
            <span>E</span>
          </div>
          <p className="diagram-label">Approved membership group</p>
          <div className="connector" aria-hidden="true">
            ↓
          </div>
          <div className="proof-block">
            <span className="symbol" aria-hidden="true">
              ◎
            </span>
            <div>
              <strong>Proof of membership</strong>
              <span>“I belong. I do not need to say who I am.”</span>
            </div>
          </div>
          <div className="connector" aria-hidden="true">
            ↓
          </div>
          <div className="flow-bottom">
            <div>
              <strong>Relay</strong>
              <span>Submits the ballot</span>
            </div>
            <span aria-hidden="true">→</span>
            <div>
              <strong>Contract</strong>
              <span>Checks & counts</span>
            </div>
          </div>
          <div className="result-strip">
            Public result <span>Private member-to-ballot link</span>
          </div>
        </div>
      </section>
      <section className="principles" aria-label="Design goals">
        <div>
          <strong>Eligibility without exposure</strong>
          <p>Membership proofs replace public voter identities.</p>
        </div>
        <div>
          <strong>One membership. One vote.</strong>
          <p>Repeat votes are rejected for each proposal.</p>
        </div>
        <div>
          <strong>Results anyone can verify</strong>
          <p>Ballot choices and totals remain public.</p>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The system, in three parts</p>
            <h2>A clear path from member to ballot.</h2>
          </div>
          <span className="tag">Under development</span>
        </div>
        <div className="module-grid">
          {modules.map((module) => (
            <article className="module-card" key={module.number}>
              <span className="module-number">{module.number}</span>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <span className="module-state">{module.state}</span>
            </article>
          ))}
        </div>
      </section>
      <aside className="boundary">
        <strong>What “private” means here</strong>
        <p>
          The goal is to hide who cast a ballot, not to hide the choice itself.
          Membership approval is managed by an administrator, and relay or
          network metadata can affect anonymity. This MVP supports advisory
          votes.
        </p>
      </aside>
    </Shell>
  );
}
