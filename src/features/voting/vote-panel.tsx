"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SemaphoreProof } from "@semaphore-protocol/proof";
import { loadIdentity } from "../membership/identity";
import { BrowserReady } from "../membership/browser-ready";
import { type Board, type Proposal, validateSnapshot } from "./model";
async function api(url: string, body?: unknown) {
  const response = await fetch(url, {
    cache: "no-store",
    ...(body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
interface VoteReceipt {
  status: string;
  hash?: string;
  id?: string;
  blockNumber?: number;
  choice?: number;
  chainId?: number;
  address?: string;
  nullifier?: string;
}
function Workspace({ demoEnabled }: { demoEnabled: boolean }) {
  const [board, setBoard] = useState<Board | null>(null),
    [selected, setSelected] = useState(""),
    [choice, setChoice] = useState(1);
  const [proof, setProof] = useState<SemaphoreProof | null>(null),
    [error, setError] = useState(""),
    [stage, setStage] = useState(""),
    [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<VoteReceipt | null>(null),
    [identity] = useState(() => {
      try {
        return loadIdentity(sessionStorage);
      } catch {
        return null;
      }
    });
  const receiptChain = board?.chainId,
    receiptAddress = board?.address,
    receiptMember = identity?.commitment.toString() || "viewer";
  const worker = useRef<Worker | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const proposal = board?.proposals.find((p) => p.id === selected);
  const eligible =
    !!identity &&
    !!proposal?.snapshot?.commitments.includes(identity.commitment.toString());
  const open =
    !!proposal &&
    !!board &&
    board.timestamp >= proposal.opensAt &&
    board.timestamp < proposal.closesAt;
  useEffect(
    () => () => {
      worker.current?.terminate();
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function refresh() {
    const data: Board = await api("/api/voting");
    setBoard(data);
    setSelected((previous) => previous || data.proposals[0]?.id || "");
    return data;
  }
  useEffect(() => {
    let active = true;
    api("/api/voting")
      .then((data: Board) => {
        if (active) {
          setBoard(data);
          setSelected(data.proposals[0]?.id || "");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function checkReceipt(hash: string) {
    const data: VoteReceipt = await api("/api/voting?receipt=" + hash);
    if (data.status === "confirmed" && data.id !== selected)
      throw new Error("Receipt belongs to another proposal.");
    setReceipt({ ...data, hash });
    if (data.status === "confirmed") {
      setStage("Your vote is confirmed on the blockchain.");
      await refresh();
    } else if (data.status === "failed") {
      setStage("");
      throw new Error(
        "The transaction failed. Refresh the proposal before trying again.",
      );
    } else
      setStage("Transaction submitted. Waiting for blockchain confirmation.");
    return data;
  }
  useEffect(() => {
    if (!receiptChain || !receiptAddress) return;
    const key =
      "pdv.receipt:" +
      receiptChain +
      ":" +
      receiptAddress +
      ":" +
      selected +
      ":" +
      receiptMember;
    try {
      const hash = sessionStorage.getItem(key);
      if (hash && /^0x[0-9a-fA-F]{64}$/.test(hash)) {
        let active = true;
        api("/api/voting?receipt=" + hash)
          .then((data) => {
            if (active && (data.status !== "confirmed" || data.id === selected))
              setReceipt({ ...data, hash });
          })
          .catch(() => {});
        return () => {
          active = false;
        };
      }
    } catch {}
  }, [receiptChain, receiptAddress, receiptMember, selected]);
  const pendingHash = receipt?.status === "pending" ? receipt.hash : undefined;
  useEffect(() => {
    if (!pendingHash) return;
    let active = true;
    const poll = setInterval(() => {
      api("/api/voting?receipt=" + pendingHash)
        .then(async (data: VoteReceipt) => {
          if (!active || data.status === "pending") return;
          if (data.status === "confirmed" && data.id !== selected) return;
          setReceipt({ ...data, hash: pendingHash });
          if (data.status === "confirmed") {
            setStage("Your vote is confirmed on the blockchain.");
            const updated = await api("/api/voting");
            if (active) setBoard(updated);
          } else {
            setStage("");
            setError("The transaction failed. Refresh before trying again.");
          }
        })
        .catch(() => {});
    }, 3000);
    return () => {
      active = false;
      clearInterval(poll);
    };
  }, [pendingHash, selected]);
  function choose(p: Proposal) {
    setSelected(p.id);
    setProof(null);
    setReceipt(null);
    setError("");
    setStage("");
    setChoice(1);
  }
  function generate() {
    if (!proposal || !identity) return;
    setError("");
    setProof(null);
    setBusy(true);
    setStage("Generating and checking your proof on this device…");
    try {
      validateSnapshot(proposal);
      worker.current = new Worker(new URL("./vote.worker.ts", import.meta.url));
      const finish = () => {
        worker.current?.terminate();
        worker.current = null;
        if (timer.current) clearTimeout(timer.current);
        setBusy(false);
      };
      timer.current = setTimeout(() => {
        finish();
        setStage("");
        setError("Proof generation timed out. Try again with this tab open.");
      }, 120000);
      worker.current.onmessage = (e) => {
        finish();
        if (e.data.error) {
          setError(e.data.error);
          setStage("");
        } else {
          setProof(e.data.proof);
          setStage("Proof ready. Review your choice, then submit your vote.");
        }
      };
      worker.current.onerror = () => {
        finish();
        setStage("");
        setError(
          "Proof worker failed. Refresh and check the proof files are available.",
        );
      };
      worker.current.postMessage({
        secret: identity.export(),
        proposal,
        choice,
      });
    } catch (e) {
      worker.current?.terminate();
      if (timer.current) clearTimeout(timer.current);
      setBusy(false);
      setStage("");
      setError(e instanceof Error ? e.message : "Unable to generate proof.");
    }
  }
  async function submit() {
    if (!proof || !proposal || !board) return;
    setBusy(true);
    setError("");
    setStage("Submitting your public proof to the relay…");
    try {
      const result = await api("/api/voting/relay", { id: proposal.id, proof });
      setReceipt({ status: "pending", hash: result.hash });
      try {
        sessionStorage.setItem(
          "pdv.receipt:" +
            board.chainId +
            ":" +
            board.address +
            ":" +
            proposal.id +
            ":" +
            receiptMember,
          result.hash,
        );
      } catch {}
      await checkReceipt(result.hash);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed.");
      setStage("");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="proof-workspace">
      <ol className="setup-steps" aria-label="Voting workflow">
        {[
          "Membership",
          "Choose proposal",
          "Create proof",
          "Confirm & results",
        ].map((label, i) => (
          <li
            key={label}
            aria-current={
              (!identity ? 0 : !proof && !receipt ? 1 : !receipt ? 2 : 3) === i
                ? "step"
                : undefined
            }
          >
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <div aria-live="polite">
        {error && (
          <p role="alert" className="proof-message error-message">
            {error}
          </p>
        )}
        {stage && <p className="proof-message success-message">{stage}</p>}
      </div>
      {!board ? (
        <section className="panel">
          <h2>Connect to voting</h2>
          <p>
            {error
              ? "The voting service is unavailable. Keep the demo terminal running and retry. Your private identity stays in this tab."
              : "Loading proposals from the blockchain…"}
          </p>
          <button
            className="button secondary"
            onClick={() => {
              setError("");
              refresh().catch((e) => setError(e.message));
            }}
          >
            Retry connection
          </button>
        </section>
      ) : (
        <>
          <div className="chain-strip">
            <span className="tag">
              {board.network} · {board.chainId}
            </span>
            <span>Read at block {board.blockNumber}</span>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => refresh().catch((e) => setError(e.message))}
            >
              Refresh results
            </button>
          </div>
          {!board.proposals.length ? (
            <section className="panel">
              <h2>No proposals yet</h2>
              <p>
                The administrator needs to publish a proposal and its approved
                membership list before voting can begin.
              </p>
              {demoEnabled && (
                <Link className="button primary" href="/admin">
                  Create the first proposal →
                </Link>
              )}
            </section>
          ) : (
            <>
              <label className="field-label" htmlFor="proposal-picker">
                Choose a proposal
              </label>
              <select
                id="proposal-picker"
                value={selected}
                disabled={busy || receipt?.status === "pending"}
                onChange={(e) => {
                  const p = board.proposals.find(
                    (p) => p.id === e.target.value,
                  );
                  if (p) choose(p);
                }}
              >
                {board.proposals.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} · {p.title}
                  </option>
                ))}
              </select>
              {proposal && (
                <section className="panel voting-panel">
                  <p className="eyebrow">
                    Proposal #{proposal.id} ·{" "}
                    {open
                      ? "Voting open"
                      : board.timestamp < proposal.opensAt
                        ? "Opens soon"
                        : "Voting closed"}
                  </p>
                  <h2>{proposal.title}</h2>
                  <div className="proposal-meta">
                    <div>
                      <span>Eligible members</span>
                      <strong>
                        {proposal.snapshot?.commitments.length ??
                          "List unavailable"}
                      </strong>
                    </div>
                    <div>
                      <span>Closes</span>
                      <strong>
                        {new Date(proposal.closesAt * 1000).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                  {!open && (
                    <p className="proof-message">
                      {board.timestamp < proposal.opensAt
                        ? "Voting has not opened yet. Return after the opening time and refresh results."
                        : "The voting deadline has passed. Results remain available, but this proposal cannot accept another vote."}
                    </p>
                  )}
                  <div className="tally-grid" aria-label="Confirmed results">
                    <div>
                      <span>Yes</span>
                      <strong>{proposal.yes}</strong>
                    </div>
                    <div>
                      <span>No</span>
                      <strong>{proposal.no}</strong>
                    </div>
                    <div>
                      <span>Total votes</span>
                      <strong>{proposal.yes + proposal.no}</strong>
                    </div>
                  </div>
                  <p>
                    Results come from the contract. Each approved identity can
                    vote once. Ballot choices are public; the proof conceals
                    which membership cast each ballot.
                  </p>
                  {!identity ? (
                    <div className="next-action">
                      <strong>Set up your identity to vote.</strong>
                      <p>You can view results without an identity.</p>
                      <Link className="button primary" href="/membership">
                        Set up or restore membership →
                      </Link>
                    </div>
                  ) : !eligible ? (
                    <p className="proof-message error-message">
                      {!proposal.snapshot
                        ? "Membership data is unavailable. The administrator must restore the public list before you can generate a proof."
                        : "Your current identity is not in this proposal’s frozen membership list. Admission to a later proposal cannot change this one."}
                    </p>
                  ) : (
                    <>
                      <p className="eligibility">
                        ✓ Your identity is included in this proposal.
                      </p>
                      {receipt?.status === "confirmed" ? (
                        <div className="verified-proof">
                          <h3>Vote confirmed</h3>
                          <p>
                            The contract has accepted this vote. This identity
                            cannot vote again on this proposal, even from
                            another browser. It can participate in other
                            proposals.
                          </p>
                          <p>
                            Your {receipt.choice === 1 ? "Yes" : "No"} vote was
                            recorded in block {receipt.blockNumber}.
                          </p>
                          <p>Transaction receipt</p>
                          <code>{receipt.hash}</code>
                          <button
                            className="button secondary"
                            onClick={() => {
                              const url = URL.createObjectURL(
                                new Blob([JSON.stringify(receipt, null, 2)], {
                                  type: "application/json",
                                }),
                              );
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = "vote-receipt.json";
                              a.click();
                              setTimeout(() => URL.revokeObjectURL(url), 1000);
                            }}
                          >
                            Download receipt
                          </button>
                        </div>
                      ) : (
                        <>
                          <fieldset
                            className="ballot-options"
                            disabled={
                              busy || !open || receipt?.status === "pending"
                            }
                          >
                            <legend>Your public ballot</legend>
                            {[1, 2].map((v) => (
                              <label key={v}>
                                <input
                                  type="radio"
                                  name="ballot"
                                  value={v}
                                  checked={choice === v}
                                  onChange={() => {
                                    setChoice(v);
                                    setProof(null);
                                    setStage("");
                                    setError("");
                                  }}
                                />
                                {v === 1
                                  ? "Yes — support this proposal"
                                  : "No — oppose this proposal"}
                              </label>
                            ))}
                          </fieldset>
                          {!receipt || receipt.status === "failed" ? (
                            <div className="actions">
                              <button
                                className="button primary"
                                disabled={busy || !open}
                                onClick={generate}
                              >
                                {busy && !proof
                                  ? "Generating proof…"
                                  : proof
                                    ? "Regenerate proof"
                                    : "Create private voting proof"}
                              </button>
                              {proof && (
                                <button
                                  className="button primary"
                                  disabled={busy || !open}
                                  onClick={submit}
                                >
                                  {busy
                                    ? "Submitting…"
                                    : "Submit " +
                                      (choice === 1 ? "Yes" : "No") +
                                      " vote →"}
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="next-action">
                              <p>
                                Transaction submitted:{" "}
                                <code>{receipt.hash}</code>
                              </p>
                              <button
                                className="button primary"
                                disabled={busy}
                                onClick={() => {
                                  setBusy(true);
                                  checkReceipt(receipt.hash!)
                                    .catch((e) => setError(e.message))
                                    .finally(() => setBusy(false));
                                }}
                              >
                                Check confirmation
                              </button>
                            </div>
                          )}
                          {proof && (
                            <details>
                              <summary>
                                Inspect the public proof sent to the relay
                              </summary>
                              <p>
                                No identity secret or individual membership ID
                                is included.
                              </p>
                              <pre className="proof-json">
                                {JSON.stringify(proof, null, 2)}
                              </pre>
                            </details>
                          )}
                        </>
                      )}
                    </>
                  )}
                  <details>
                    <summary>Verify the proposal’s public details</summary>
                    <p>
                      The membership root is a fingerprint of the approved list.
                      The scope binds this proof to one proposal and deployment.
                      Neither can be changed by a voter.
                    </p>
                    {proposal.snapshot && (
                      <details>
                        <summary>
                          View the frozen membership list (
                          {proposal.snapshot.commitments.length})
                        </summary>
                        <ol className="commitment-list">
                          {proposal.snapshot.commitments.map((member) => (
                            <li key={member}>
                              <code>{member}</code>
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}
                    <p>
                      Contract: <code>{board.address}</code>
                    </p>
                    <p>
                      Frozen membership root: <code>{proposal.root}</code>
                    </p>
                    <p>
                      Proposal scope: <code>{proposal.scope}</code>
                    </p>
                    <p>
                      The administrator chooses who belongs to the group. One
                      membership is not automatically proof of one human.
                    </p>
                  </details>
                </section>
              )}
            </>
          )}
        </>
      )}
      <aside className="boundary home-boundary">
        <strong>Privacy you can understand</strong>
        <p>
          Your secret stays in this tab. The relay pays transaction fees and
          sees the public proof and choice; network timing and IP addresses can
          still reveal metadata. This is anonymous membership verification, not
          encrypted ballots.
        </p>
      </aside>
      <Link className="back-link" href="/membership">
        ← Manage your identity and backup
      </Link>
    </div>
  );
}
export function VotePanel({ demoEnabled }: { demoEnabled: boolean }) {
  return (
    <BrowserReady>
      <Workspace demoEnabled={demoEnabled} />
    </BrowserReady>
  );
}
