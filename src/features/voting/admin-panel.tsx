"use client";
import { useState } from "react";
import Link from "next/link";
import { GROUP_STORAGE_KEY, readSnapshot } from "../membership/group";
export function AdminPanel() {
  const [title, setTitle] = useState(
      "Should our DAO fund a community workshop?",
    ),
    [minutes, setMinutes] = useState("60"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [hash, setHash] = useState("");
  return (
    <div className="proof-workspace">
      <section className="panel">
        <p className="eyebrow">Local administrator</p>
        <h2>Publish a community decision</h2>
        <p>
          First approve members in the local group. Publishing freezes that
          membership list in the contract. Later changes apply only to future
          proposals.
        </p>
        <Link className="button secondary" href="/demo">
          1. Set up the membership group →
        </Link>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            setHash("");
            try {
              const raw = localStorage.getItem(GROUP_STORAGE_KEY);
              if (!raw) throw new Error("Create a local group first.");
              const snapshot = readSnapshot(raw);
              const response = await fetch("/api/voting/proposals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title,
                  minutes: Number(minutes),
                  snapshot,
                }),
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error);
              setHash(result.hash);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Publishing failed.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="field-label" htmlFor="proposal-title">
            Proposal question
          </label>
          <input
            id="proposal-title"
            value={title}
            maxLength={200}
            required
            onChange={(e) => setTitle(e.target.value)}
          />
          <label className="field-label" htmlFor="duration">
            Voting duration in minutes
          </label>
          <input
            id="duration"
            type="number"
            min={1}
            max={10080}
            required
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
          <p>
            Voting opens immediately. The title, deadline and eligible group
            cannot be edited after publication.
          </p>
          <button className="button primary" disabled={busy}>
            {busy ? "Publishing to the blockchain…" : "2. Publish proposal"}
          </button>
        </form>
        <div aria-live="polite">
          {error && (
            <p role="alert" className="proof-message error-message">
              {error}
            </p>
          )}
          {hash && (
            <>
              <p className="proof-message success-message">
                Proposal confirmed on the local blockchain.
              </p>
              <code>{hash}</code>
              <div className="actions">
                <Link className="button primary" href="/vote">
                  3. Open voting →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
      <aside className="boundary home-boundary">
        <strong>Demo administration only</strong>
        <p>
          This page uses a disposable local administrator account. Public
          testnet administration must use a separately secured wallet and
          admission process.
        </p>
      </aside>
    </div>
  );
}
