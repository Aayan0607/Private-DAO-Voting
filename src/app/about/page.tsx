import Link from "next/link";
import { Shell } from "@/components/shell";
export default function About() {
  return (
    <Shell active="/about">
      <section className="workflow-intro">
        <p className="eyebrow">Architecture & evaluation</p>
        <h1>
          What makes a vote <em>verifiable?</em>
        </h1>
      </section>
      <div className="proof-workspace">
        <ol className="journey">
          <li>
            <span>01</span>
            <strong>Member’s browser</strong>
            <p>
              Creates a private identity and generates a Semaphore membership
              proof bound to a ballot and proposal.
            </p>
          </li>
          <li>
            <span>02</span>
            <strong>Transaction relay</strong>
            <p>
              Receives only public proof data, checks the request and submits
              the vote using its funded account.
            </p>
          </li>
          <li>
            <span>03</span>
            <strong>Voting contract</strong>
            <p>
              Verifies the proof, eligibility and deadline, consumes the
              nullifier and updates the public tally.
            </p>
          </li>
        </ol>
        <section className="panel">
          <h2>Two ways to explore</h2>
          <p>
            <strong>Online preview:</strong> a browser-only simulation using
            sample data. No proofs, blockchain transactions or receipts are
            produced.
          </p>
          <p>
            <strong>Local MVP:</strong> real Semaphore proofs and Solidity
            transactions on a local Hardhat blockchain. Clone the repository,
            install Node.js 24.x, then run:
          </p>
          <pre className="proof-json">
            npm ci
            <br />
            npm run demo:start
          </pre>
          <p>
            Open localhost:3000. Follow the README to create an identity,
            approve membership, publish a proposal and vote. Keep the terminal
            running.
          </p>
          <a
            className="button primary"
            href="https://github.com/Aayan0607/Private-DAO-Voting"
          >
            Review the source code →
          </a>
        </section>
        <aside className="boundary home-boundary">
          <strong>Privacy and deployment status</strong>
          <p>
            Ballots and group commitments are public. The proof conceals which
            membership cast a ballot; metadata and small groups can weaken
            privacy. Administrators control admission, and one identity is not
            proof of one human. This is advisory voting, not treasury execution.
            No MST testnet deployment has been performed.
          </p>
        </aside>
        <Link className="button secondary" href="/preview">
          Explore the simulated workflow →
        </Link>
      </div>
    </Shell>
  );
}
