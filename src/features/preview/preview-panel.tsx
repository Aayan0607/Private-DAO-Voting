"use client";
import { useState } from "react";
import Link from "next/link";
export function PreviewPanel() {
  const [step, setStep] = useState(0),
    [choice, setChoice] = useState("yes"),
    [result, setResult] = useState(""),
    [outsider, setOutsider] = useState(false);
  const labels = [
    "Approve membership",
    "Publish proposal",
    "Prepare ballot",
    "Simulated result",
  ];
  return (
    <div className="proof-workspace">
      <aside className="boundary preview-notice">
        <strong>Interactive preview — simulated transactions</strong>
        <p>
          Sample identities and results only. No cryptographic proof is
          generated, no wallet is connected and no transaction is sent. Refresh
          or reset to start again.
        </p>
      </aside>
      <ol className="setup-steps" aria-label="Preview workflow">
        {labels.map((label, i) => (
          <li key={label} aria-current={step === i ? "step" : undefined}>
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <section className="panel">
        <p className="eyebrow">
          {step < 2 ? "Administrator walkthrough" : "Member walkthrough"} ·
          Simulation
        </p>
        {step === 0 && (
          <>
            <h2>Approve a sample member</h2>
            <p>
              Imagine a community with five approved members. Alex wants to
              join. The administrator admits Alex’s public membership ID; the
              private secret stays with the member.
            </p>
            <div className="member-nodes" aria-label="Five sample members">
              {["A", "B", "C", "D", "E"].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
            <button className="button primary" onClick={() => setStep(1)}>
              Approve Alex in preview →
            </button>
          </>
        )}
        {step === 1 && (
          <>
            <h2>Publish a community decision</h2>
            <p>Should our community fund a workshop?</p>
            <div className="proposal-meta">
              <div>
                <span>Sample eligible group</span>
                <strong>6 members, including Alex</strong>
              </div>
              <div>
                <span>Membership rule</span>
                <strong>Frozen at publication</strong>
              </div>
            </div>
            <p>
              In the working local MVP, the contract stores this fixed group and
              a voting deadline. This preview illustrates the same sequence.
            </p>
            <button className="button primary" onClick={() => setStep(2)}>
              Publish sample proposal →
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <h2>Choose Alex’s ballot</h2>
            <p>
              The working MVP generates a Semaphore proof on the member’s
              device. Here, we illustrate the outcome without running
              cryptography.
            </p>
            <fieldset className="ballot-options">
              <legend>Sample choice</legend>
              {["yes", "no"].map((v) => (
                <label key={v}>
                  <input
                    type="radio"
                    name="preview-ballot"
                    checked={choice === v}
                    onChange={() => setChoice(v)}
                  />
                  {v === "yes"
                    ? "Yes — support the workshop"
                    : "No — oppose the workshop"}
                </label>
              ))}
            </fieldset>
            <button
              className="button primary"
              onClick={() => {
                setStep(3);
                setResult(
                  "Simulated acceptance: Alex’s first vote is counted.",
                );
              }}
            >
              Simulate first vote →
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <h2>Simulated result</h2>
            <p>Should our community fund a workshop?</p>
            <div className="tally-grid" aria-label="Simulated tally">
              <div>
                <span>Yes</span>
                <strong>{choice === "yes" ? 1 : 0}</strong>
              </div>
              <div>
                <span>No</span>
                <strong>{choice === "no" ? 1 : 0}</strong>
              </div>
              <div>
                <span>Total sample votes</span>
                <strong>1</strong>
              </div>
            </div>
            <p>
              No blockchain receipt exists for this preview. These counts are
              held only in this page’s memory.
            </p>
            <h3>Explore the voting rules</h3>
            <div className="actions">
              <button
                className="button secondary"
                onClick={() =>
                  setResult(
                    "Simulated rejection: Alex has already voted. A second vote, even with the opposite choice, does not change the tally.",
                  )
                }
              >
                Try Alex voting again
              </button>
              <button
                className="button secondary"
                onClick={() =>
                  setResult(
                    "Simulated rejection: Sam is not in this proposal’s frozen membership list.",
                  )
                }
              >
                Try unapproved member Sam
              </button>
              <button
                className="button secondary"
                disabled={outsider}
                onClick={() => {
                  setOutsider(true);
                  setResult(
                    "Simulated admission: Sam joins the current group, but remains ineligible for this existing proposal. A new proposal must include the updated group.",
                  );
                }}
              >
                Admit Sam after publication
              </button>
            </div>
          </>
        )}
        <div aria-live="polite">
          {result && <p className="proof-message preview-result">{result}</p>}
        </div>
      </section>
      <div className="workflow-actions">
        <button
          className="text-button"
          onClick={() => {
            setStep(0);
            setChoice("yes");
            setResult("");
            setOutsider(false);
          }}
        >
          Reset preview
        </button>
      </div>
      <section className="boundary">
        <strong>Try the real implementation</strong>
        <p>
          The local MVP generates real proofs, verifies them with a Solidity
          contract and returns actual local-chain receipts. Members do not need
          their own blockchain wallet; a relay submits their proofs.
        </p>
        <a
          className="button secondary"
          href="https://github.com/Aayan0607/Private-DAO-Voting#quick-start--no-wallet-or-rust-needed"
        >
          Open source & local setup →
        </a>
      </section>
      <Link className="back-link" href="/about">
        How the real system works →
      </Link>
    </div>
  );
}
