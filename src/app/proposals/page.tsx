import type { Metadata } from "next";
import { Shell } from "@/components/shell";
import { previewProposal as proposal } from "@/features/proposals/preview";
export const metadata: Metadata = { title: "Proposals" };
export default function Proposals() {
  return (
    <Shell active="/proposals">
      <section className="page-intro">
        <p className="eyebrow">Community decisions</p>
        <h1>
          Discuss openly.
          <br />
          <em>Vote independently.</em>
        </h1>
        <p className="lead">
          A preview of the first end-to-end voting scenario. No real proposal,
          votes, or transactions exist yet.
        </p>
      </section>
      <div className="two-column">
        <article className="panel proposal-panel">
          <div className="card-heading">
            <span className="eyebrow">{proposal.community}</span>
            <span className="tag">Example only</span>
          </div>
          <h2>{proposal.title}</h2>
          <p>{proposal.description}</p>
          <div className="proposal-meta">
            <div>
              <span>Planned test group</span>
              <strong>{proposal.eligibleMembers} memberships</strong>
            </div>
            <div>
              <span>Voting type</span>
              <strong>Advisory · Yes / No</strong>
            </div>
          </div>
          <div className="ballot-preview">
            {proposal.choices.map((choice) => (
              <div key={choice}>
                <span aria-hidden="true">○</span>
                {choice}
              </div>
            ))}
          </div>
          <button disabled className="button primary">
            Voting available in Phase 2
          </button>
        </article>
        <section className="panel">
          <p className="eyebrow">Verification, not guesswork</p>
          <h2>Before a vote counts</h2>
          <ol className="check-list">
            <li>
              <strong>Membership is proven</strong>
              <p>A valid proof matches the proposal’s approved group.</p>
            </li>
            <li>
              <strong>The ballot is bound</strong>
              <p>The proof belongs to this proposal and this choice.</p>
            </li>
            <li>
              <strong>Repeat votes are blocked</strong>
              <p>A proposal-specific nullifier prevents reuse.</p>
            </li>
            <li>
              <strong>The deadline is checked</strong>
              <p>Only ballots received during the voting window count.</p>
            </li>
          </ol>
          <p className="stage-note">
            These checks are planned contract behavior. They are not implemented
            in this preview.
          </p>
        </section>
      </div>
    </Shell>
  );
}
