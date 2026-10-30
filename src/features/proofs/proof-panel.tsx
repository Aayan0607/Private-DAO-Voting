"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SemaphoreProof } from "@semaphore-protocol/proof";
import { BrowserReady } from "../membership/browser-ready";
import { loadIdentity } from "../membership/identity";
import { GROUP_STORAGE_KEY, readSnapshot } from "../membership/group";
import {
  createContext,
  parseProof,
  readContext,
  recordNullifier,
  SESSION_KEY,
  type Choice,
  type ProofContext,
} from "./context";

function Workspace() {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return { context: raw ? readContext(raw) : null, error: "" };
    } catch {
      return {
        context: null,
        error:
          "The saved proof round is unreadable. Clear site data only after backing up your identity.",
      };
    }
  });
  const [context, setContext] = useState<ProofContext | null>(initial.context);
  const [choice, setChoice] = useState<Choice>("yes");
  const [proof, setProof] = useState<SemaphoreProof | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(initial.error);
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [importText, setImportText] = useState("");
  const [newRound, setNewRound] = useState(false);
  const worker = useRef<Worker | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      worker.current?.terminate();
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function stop() {
    worker.current?.terminate();
    worker.current = null;
    if (timer.current) clearTimeout(timer.current);
    setBusy(false);
  }
  function startRound() {
    setError("");
    setStatus("");
    try {
      const raw = localStorage.getItem(GROUP_STORAGE_KEY);
      if (!raw)
        throw new Error(
          "Create a local group and admit your membership ID first.",
        );
      const existing = localStorage.getItem(SESSION_KEY);
      const previous = existing ? readContext(existing) : null;
      const next = createContext(readSnapshot(raw), (previous?.round ?? 0) + 1);
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      setContext(next);
      setProof(null);
      setAccepted(false);
      setNewRound(false);
      setStatus(
        "Group snapshot frozen. Choose a ballot and generate your proof.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not open the round.",
      );
    }
  }
  function run(
    operation: "generate" | "verify",
    candidate?: SemaphoreProof,
    record = false,
  ) {
    if (!context || busy) return;
    setError("");
    setStatus("Preparing the proof engine…");
    setBusy(true);
    try {
      const current = localStorage.getItem(SESSION_KEY);
      if (
        !current ||
        JSON.stringify(readContext(current)) !== JSON.stringify(context)
      )
        throw new Error("The round changed in another tab. Reload this page.");
      const identity =
        operation === "generate" ? loadIdentity(sessionStorage) : null;
      if (operation === "generate" && !identity)
        throw new Error(
          "Set up or restore your identity before generating a proof.",
        );
      const instance = new Worker(
        new URL("./proof.worker.ts", import.meta.url),
        { type: "module" },
      );
      worker.current = instance;
      timer.current = setTimeout(() => {
        stop();
        setError(
          "Proof processing timed out. Try again or use a desktop browser.",
        );
        setStatus("");
      }, 180000);
      instance.onerror = () => {
        stop();
        setError(
          "The proof engine could not load. Check your connection and try again.",
        );
        setStatus("");
      };
      instance.onmessage = (event) => {
        if (event.data.stage) {
          setStatus(event.data.stage);
          return;
        }
        stop();
        if (event.data.error) {
          setError(event.data.error);
          setStatus("");
          return;
        }
        try {
          const verified = parseProof(event.data.proof);
          if (record) {
            const latest = localStorage.getItem(SESSION_KEY);
            if (
              !latest ||
              JSON.stringify(readContext(latest)) !== JSON.stringify(context)
            )
              throw new Error("The round changed. Nothing was recorded.");
            recordNullifier(verified, context, localStorage);
            setAccepted(true);
            setStatus(
              "Verified and recorded in this browser. Repeating this submission will be rejected.",
            );
          } else {
            setProof(verified);
            setAccepted(false);
            setStatus(
              "Proof verified. Membership, round and selected ballot all match.",
            );
          }
        } catch (cause) {
          setError(
            cause instanceof Error ? cause.message : "Could not record proof.",
          );
          setStatus("");
        }
      };
      // Secret is sent only to a same-origin browser worker, never an API.
      instance.postMessage({
        operation,
        context,
        choice,
        ...(identity ? { secret: identity.export() } : {}),
        ...(candidate ? { proof: candidate } : {}),
      });
    } catch (cause) {
      stop();
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not start proof generation.",
      );
      setStatus("");
    }
  }
  return (
    <div className="proof-workspace">
      <p className="back-link">
        <Link href="/membership">← Back to membership setup</Link>
      </p>
      <aside className="boundary">
        <strong>Real cryptography. Local demonstration.</strong>
        <p>
          The proof is generated and verified on your device. Your choice is
          public; your private key and individual membership ID are absent from
          the proof. No blockchain transaction or DAO vote is submitted here.
        </p>
      </aside>
      <div aria-live="polite">
        {error && (
          <p className="error-message proof-message" role="alert">
            {error}
          </p>
        )}
        {status && (
          <p className="success-message proof-message" role="status">
            {status}
          </p>
        )}
      </div>
      {!context ? (
        <section className="panel">
          <p className="eyebrow">Prepare the round</p>
          <h2>Freeze the eligible group.</h2>
          <p>
            Take a snapshot of your local group before making a proof. Later
            admissions will not change this round.
          </p>
          <button className="button primary" onClick={startRound}>
            Start proof round →
          </button>
          <p>
            <Link className="text-button" href="/demo">
              Set up the local group first
            </Link>
          </p>
        </section>
      ) : (
        <section className="panel">
          <p className="eyebrow">Workshop proposal · Round {context.round}</p>
          <h2>Fund a community Solidity workshop?</h2>
          <p>
            Prove that one of the {context.snapshot.commitments.length} admitted
            members supports the choice below, without identifying which member.
          </p>
          <fieldset className="ballot-options" disabled={busy}>
            <legend>Your public choice</legend>
            {(["yes", "no"] as const).map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="ballot"
                  checked={choice === value}
                  onChange={() => {
                    setChoice(value);
                    setProof(null);
                    setAccepted(false);
                    setError("");
                    setStatus("");
                  }}
                />
                {value === "yes"
                  ? "Yes, support the workshop"
                  : "No, not this time"}
              </label>
            ))}
          </fieldset>
          <button
            className="button primary"
            disabled={busy}
            onClick={() => run("generate")}
          >
            {busy ? "Processing…" : "Generate & verify my proof"}
          </button>
          {busy && (
            <button
              className="text-button"
              onClick={() => {
                stop();
                setStatus("Cancelled. No submission was recorded.");
              }}
            >
              Cancel
            </button>
          )}
          {proof && (
            <div className="verified-proof">
              <h3>✓ Your proof is valid</h3>
              <ul>
                <li>Member of the frozen group</li>
                <li>
                  Bound to round {context.round} and your {choice.toUpperCase()}{" "}
                  choice
                </li>
                <li>No individual membership ID in the proof</li>
              </ul>
              <p>
                A nullifier lets a verifier detect a repeat submission in this
                round.
              </p>
              <div className="actions">
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() => run("verify", proof, true)}
                >
                  {accepted
                    ? "Try submitting again"
                    : "Record verified demo ballot"}
                </button>
                <button
                  className="button secondary"
                  onClick={() => {
                    const url = URL.createObjectURL(
                      new Blob([JSON.stringify(proof, null, 2)], {
                        type: "application/json",
                      }),
                    );
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "private-dao-public-proof.json";
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}
                >
                  Download public proof
                </button>
              </div>
              <p className="stage-note">
                Duplicate protection here uses browser storage. Clearing storage
                or using another browser bypasses that local record. The voting
                contract enforces duplicate protection in the voting workflow.
              </p>
              <details>
                <summary>View public proof data</summary>
                <pre className="proof-json">
                  {JSON.stringify(proof, null, 2)}
                </pre>
              </details>
            </div>
          )}
          <details className="verifier-tools">
            <summary>Verify a saved proof or test an altered ballot</summary>
            <p>
              Verification uses this round’s frozen group and the choice
              selected above. You do not need the member’s private identity.
            </p>
            <label className="field-label" htmlFor="public-proof">
              Public proof JSON
            </label>
            <textarea
              id="public-proof"
              value={importText}
              maxLength={8192}
              rows={6}
              onChange={(e) => setImportText(e.target.value)}
            />
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => {
                try {
                  run("verify", parseProof(JSON.parse(importText)));
                } catch {
                  setError("Paste a valid public proof JSON file.");
                }
              }}
            >
              Verify pasted proof
            </button>
            {proof && (
              <button
                className="button secondary"
                disabled={busy}
                onClick={() =>
                  run("verify", {
                    ...proof,
                    message: proof.message === "1" ? "2" : "1",
                  })
                }
              >
                Test altered ballot
              </button>
            )}
          </details>
          <details>
            <summary>Round details</summary>
            <p>Frozen group root</p>
            <code>{context.snapshot.root}</code>
            <p>Round scope (local domain)</p>
            <code>{context.scope}</code>
          </details>
        </section>
      )}
      {context && (
        <div className="workflow-actions">
          {newRound ? (
            <>
              <p>
                A new round uses the current group and a new scope. Existing
                receipts stay associated with their original round.
              </p>
              <button
                className="button secondary"
                disabled={busy}
                onClick={startRound}
              >
                Confirm new round
              </button>{" "}
              <button
                className="text-button"
                onClick={() => setNewRound(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="text-button"
              disabled={busy}
              onClick={() => setNewRound(true)}
            >
              Start another demonstration round
            </button>
          )}
        </div>
      )}
    </div>
  );
}
export function ProofPanel() {
  return (
    <BrowserReady>
      <Workspace />
    </BrowserReady>
  );
}
