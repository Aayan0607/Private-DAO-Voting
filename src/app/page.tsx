import Link from "next/link";
import { Shell } from "@/components/shell";
export default function Home() {
  return (
    <Shell active="/">
      <section className="welcome">
        <span className="welcome-label">PRIVATE DAO VOTING</span>
        <h1>
          A private identity.
          <br />
          <em>A place in your community.</em>
        </h1>
        <p className="lead">
          Set up the identity you’ll use for DAO membership. Your secret stays
          on your device; only your public membership ID is shared.
        </p>
        <Link className="button primary start-button" href="/membership">
          Set up my membership <span aria-hidden="true">→</span>
        </Link>
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
            <strong>Keep it safe</strong>
            <p>Save a password-protected recovery file for later.</p>
          </li>
          <li>
            <span>03</span>
            <strong>Check membership</strong>
            <p>Share your public ID and check the local community group.</p>
          </li>
        </ol>
        <div className="scope-note">
          <strong>What you can try today</strong>
          <p>
            Identity setup, encrypted recovery and local group membership.
            Generate and verify real membership proofs in the local demo.
            On-chain voting is not connected yet.
          </p>
        </div>
      </section>
    </Shell>
  );
}
