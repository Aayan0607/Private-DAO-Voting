"use client";
import { useState } from "react";
import Link from "next/link";
import type { Identity } from "@semaphore-protocol/identity";
import { BrowserReady } from "./browser-ready";
import {
  createIdentity,
  loadIdentity,
  saveIdentity,
  IDENTITY_SESSION_KEY,
} from "./identity";
import { decryptBackup, encryptBackup } from "./backup";
import { GROUP_STORAGE_KEY, readSnapshot } from "./group";

function download(text: string, filename: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function MemberWorkspace({ demoEnabled }: { demoEnabled: boolean }) {
  const [initial] = useState(() => {
    try {
      return { identity: loadIdentity(sessionStorage), error: "" };
    } catch {
      return {
        identity: null,
        error:
          "Saved identity data is unreadable or browser storage is blocked. Clear this tab’s identity or restore a backup.",
      };
    }
  });
  const [identity, setIdentity] = useState<Identity | null>(initial.identity);
  const [step, setStep] = useState(initial.identity ? 2 : 1);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState(initial.error);
  const [notice, setNotice] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  async function action(work: () => void | Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Action failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  function install(next: Identity) {
    saveIdentity(sessionStorage, next);
    setIdentity(next);
    setStep(2);
    setRestoring(false);
    setPassword("");
    setConfirmation("");
  }
  return (
    <>
      <ol className="setup-steps" aria-label="Membership setup">
        {["Your identity", "Your backup", "Your membership", "Your vote"].map(
          (label, index) => (
            <li
              key={label}
              aria-current={step === index + 1 ? "step" : undefined}
            >
              <span>{index + 1}</span>
              {label}
            </li>
          ),
        )}
      </ol>
      <div className="feedback" aria-live="polite">
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        {notice && <p className="success-message">{notice}</p>}
      </div>
      <div className="workflow-content">
        <section className="panel" hidden={step === 2 || restoring}>
          <p className="eyebrow">
            {step === 3 ? "Step 3 · Membership" : "Step 1 · Identity"}
          </p>
          <h2>
            {identity
              ? "This is your public membership ID."
              : "Create your private identity."}
          </h2>
          <p>
            The secret stays in this browser tab. It survives a refresh, but
            closing the tab may erase it. Save an encrypted backup before
            leaving.
          </p>
          {identity ? (
            <>
              <label className="field-label" htmlFor="commitment">
                Public membership ID (identity commitment)
              </label>
              <textarea
                id="commitment"
                className="commitment"
                readOnly
                value={identity.commitment.toString()}
                rows={3}
              />
              <div className="actions">
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() =>
                    action(async () => {
                      await navigator.clipboard.writeText(
                        identity.commitment.toString(),
                      );
                      setNotice("Public commitment copied.");
                    })
                  }
                >
                  Copy membership ID
                </button>
                {demoEnabled && (
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() =>
                      action(() => {
                        const stored = localStorage.getItem(GROUP_STORAGE_KEY);
                        if (!stored)
                          throw new Error(
                            "No local group exists yet. Use the group setup link below to create one, then return here.",
                          );
                        const group = readSnapshot(stored);
                        setNotice(
                          group.commitments.includes(
                            identity.commitment.toString(),
                          )
                            ? "You are in the local group. Membership is confirmed locally; this is not yet a voting proof."
                            : "You are not in the local group yet. Copy your membership ID and use the group setup link below to add it.",
                        );
                      })
                    }
                  >
                    Check local membership
                  </button>
                )}
              </div>
            </>
          ) : (
            <button
              className="button primary"
              disabled={busy}
              onClick={() =>
                action(() => {
                  if (sessionStorage.getItem(IDENTITY_SESSION_KEY))
                    throw new Error(
                      "Clear the unreadable saved identity before creating another.",
                    );
                  install(createIdentity());
                  setNotice(
                    "Identity created on this device. Save an encrypted backup.",
                  );
                })
              }
            >
              Create private identity
            </button>
          )}
          {(identity || initial.error) && (
            <div className="danger-zone">
              {!clearConfirm ? (
                <button
                  className="text-button"
                  onClick={() => setClearConfirm(true)}
                >
                  Clear identity from this tab
                </button>
              ) : (
                <>
                  <p>
                    This removes the active secret from this tab. Without a
                    backup you cannot recover it. It does not remove your public
                    group membership.
                  </p>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() =>
                      action(() => {
                        sessionStorage.removeItem(IDENTITY_SESSION_KEY);
                        setIdentity(null);
                        setStep(1);
                        setClearConfirm(false);
                        setPassword("");
                        setConfirmation("");
                        setNotice("Identity cleared from this tab.");
                      })
                    }
                  >
                    Confirm clear identity
                  </button>{" "}
                  <button
                    className="text-button"
                    onClick={() => setClearConfirm(false)}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </section>
        <section className="panel" hidden={step !== 2 && !restoring}>
          <p className="eyebrow">
            {identity ? "Step 2 · Backup" : "Restore your identity"}
          </p>
          <h2>
            {identity ? "Protect your access." : "Already have an identity?"}
          </h2>
          {identity ? (
            <form
              key="backup"
              onSubmit={(event) => {
                event.preventDefault();
                void action(async () => {
                  if (password !== confirmation)
                    throw new Error("The passwords do not match.");
                  const backup = await encryptBackup(identity, password);
                  download(backup, "private-dao-identity.encrypted.json");
                  setPassword("");
                  setConfirmation("");
                  setNotice(
                    "Encrypted backup downloaded. Keep the file and password safe; we cannot recover either.",
                  );
                });
              }}
            >
              <p>
                The backup is encrypted on your device. Choose a strong, unique
                password; the password is never saved.
              </p>
              <label className="field-label" htmlFor="backup-password">
                Backup password (at least 12 characters)
              </label>
              <input
                id="backup-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={1024}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label className="field-label" htmlFor="confirm-password">
                Confirm backup password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
              <button className="button primary" disabled={busy} type="submit">
                {busy ? "Working…" : "Save encrypted backup"}
              </button>
            </form>
          ) : (
            <form
              key="restore"
              onSubmit={(event) => {
                event.preventDefault();
                void action(async () => {
                  if (!file || file.size > 4096)
                    throw new Error(
                      "Choose an encrypted identity backup smaller than 4 KB.",
                    );
                  install(await decryptBackup(await file.text(), password));
                  setFile(null);
                  setNotice(
                    "Identity restored. Your public commitment is unchanged.",
                  );
                });
              }}
            >
              <p>
                Restore locally from your encrypted backup. The file and
                password are not uploaded.
              </p>
              <label className="field-label" htmlFor="backup-file">
                Encrypted backup file
              </label>
              <input
                id="backup-file"
                type="file"
                accept=".json,application/json"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <label className="field-label" htmlFor="restore-password">
                Backup password
              </label>
              <input
                id="restore-password"
                type="password"
                autoComplete="off"
                required
                maxLength={1024}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="button primary" disabled={busy} type="submit">
                {busy ? "Restoring…" : "Restore identity"}
              </button>
            </form>
          )}
        </section>
      </div>
      <div className="workflow-actions">
        {step === 1 && !restoring && (
          <button
            className="text-button"
            onClick={() => {
              setRestoring(true);
              setError("");
              setNotice("");
            }}
          >
            I already have a backup →
          </button>
        )}
        {restoring && (
          <button className="text-button" onClick={() => setRestoring(false)}>
            ← Create a new identity instead
          </button>
        )}
        {step === 2 && (
          <>
            <p>
              Keep your recovery file and password somewhere safe before
              continuing.
            </p>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => {
                setStep(3);
                setNotice("");
                setError("");
              }}
            >
              Continue to membership →
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <button
              className="text-button"
              onClick={() => {
                setStep(2);
                setNotice("");
              }}
            >
              ← Back to backup
            </button>
            {
              <div className="next-action">
                <strong>Ready to vote?</strong>
                <p>
                  Use the admitted identity to generate a private membership
                  proof for a public Yes / No choice.
                </p>
                <Link className="button primary" href="/vote">
                  Continue to proposals →
                </Link>
              </div>
            }
            {demoEnabled && (
              <div className="next-action">
                <strong>Administrator step: approve your public ID</strong>
                <p>
                  Copy your public membership ID above. For this local
                  demonstration, create a group and add your public membership
                  ID. Then return here to check your membership.
                </p>
                <Link className="button secondary" href="/demo">
                  Set up the local group →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
      <aside className="boundary workflow-privacy">
        <strong>Local storage has limits</strong>
        <p>
          The active secret is not encrypted in this tab’s session storage.
          Scripts running on this origin and someone using this browser profile
          could access it. Backups are encrypted; a forgotten password cannot be
          reset. Do not use this prototype for valuable assets.
        </p>
      </aside>
    </>
  );
}
export function MemberPanel({ demoEnabled }: { demoEnabled: boolean }) {
  return (
    <BrowserReady>
      <MemberWorkspace demoEnabled={demoEnabled} />
    </BrowserReady>
  );
}
