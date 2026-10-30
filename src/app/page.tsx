export const dynamic = "force-dynamic";
import Link from "next/link";
import { Shell } from "@/components/shell";
export default function Home() {
  const hostedPreview =
    process.env.VERCEL === "1" && !process.env.VOTING_CONTRACT_ADDRESS;
  return (
    <Shell active="/">
      <section className="welcome">
        <span className="welcome-label">PRIVATE DAO VOTING</span>
        <h1>
          A private identity.
          <br />
          <em>A verifiable community vote.</em>
        </h1>
        <p className="lead">
          Prove you belong to your DAO without linking your membership to your
          ballot. Your secret stays on your device; the blockchain verifies
          every vote.
        </p>
        <Link
          className="button primary start-button"
          href={hostedPreview ? "/preview" : "/membership"}
        >
          {hostedPreview
            ? "Explore interactive preview"
            : "Set up my membership"}{" "}
          <span aria-hidden="true">→</span>
        </Link>
        {hostedPreview && (
          <aside className="boundary preview-notice">
            <strong>Hosted preview · simulated transactions</strong>
            <p>
              The complete blockchain MVP runs locally. Explore sample
              interactions here, or use the repository to verify real proofs and
              voting.
            </p>
          </aside>
        )}
        <p className="welcome-hint">
          Already started? You can restore your identity in the first step.
        </p>
        <ol className="journey">
          <li>
            <span>01</span>
            <strong>Create your identity</strong>
            <p>Generate a private key in your browser, or restore a backup.</p>
          </li>
          <li>
            <span>02</span>
            <strong>Prove you belong</strong>
            <p>Back up your identity and prove eligibility for a proposal.</p>
          </li>
          <li>
            <span>03</span>
            <strong>Cast and verify</strong>
            <p>
              Submit your proof and see your confirmed vote in the public tally.
            </p>
          </li>
        </ol>
        <div className="actions" style={{ justifyContent: "center" }}>
          <Link
            className="button secondary"
            href={hostedPreview ? "/about" : "/vote"}
          >
            {hostedPreview
              ? "Architecture & local setup →"
              : "View proposals & results →"}
          </Link>
          {process.env.VERCEL !== "1" &&
            process.env.ENABLE_LOCAL_DEMO === "true" && (
              <Link className="button secondary" href="/admin">
                Prepare local demonstration →
              </Link>
            )}
        </div>
        <div className="actions" style={{ justifyContent: "center" }}>
          <Link className="back-link" href="/preview">
            Explore simulated workflow →
          </Link>
          <Link className="back-link" href="/about">
            How it works →
          </Link>
        </div>
        <div className="scope-note">
          <strong>A transparent result. A private membership.</strong>
          <p>
            Real zero-knowledge proofs, contract-enforced voting and verifiable
            receipts. Ballots are public; your membership-to-ballot link is
            concealed.
          </p>
        </div>
      </section>
    </Shell>
  );
}
