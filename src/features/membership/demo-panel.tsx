"use client";
import { useState } from "react";
import Link from "next/link";
import { BrowserReady } from "./browser-ready";
import {
  createIdentity,
  importIdentity,
  saveIdentity,
  IDENTITY_SESSION_KEY,
} from "./identity";
import {
  buildSnapshot,
  GROUP_STORAGE_KEY,
  readSnapshot,
  type MembershipSnapshot,
} from "./group";
const DEMO_KEY = "pdv.demo.identities.v1";
function DemoWorkspace() {
  const [initial] = useState(() => {
    try {
      const raw = sessionStorage.getItem(DEMO_KEY);
      const data: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(data) || ![0, 5].includes(data.length))
        throw new Error();
      const identities = data.map(importIdentity);
      const publicGroup = localStorage.getItem(GROUP_STORAGE_KEY);
      return {
        identities,
        group: publicGroup ? readSnapshot(publicGroup) : null,
        error: "",
      };
    } catch {
      return {
        identities: [],
        group: null,
        error:
          "Local demo data could not be loaded. Reset the demo workspace to recover.",
      };
    }
  });
  const [identities, setIdentities] = useState(initial.identities);
  const [group, setGroup] = useState<MembershipSnapshot | null>(initial.group);
  const [error, setError] = useState(initial.error);
  const [notice, setNotice] = useState("");
  const [commitment, setCommitment] = useState("");
  const [resetConfirm, setResetConfirm] = useState(false);
  function run(work: () => void) {
    setError("");
    setNotice("");
    try {
      work();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update the local demo.",
      );
    }
  }
  function persistGroup(next: MembershipSnapshot) {
    localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(next));
    setGroup(next);
  }
  return (
    <>
      <aside className="boundary">
        <strong>Local demonstration only</strong>
        <p>
          This workspace lets you act as an admission administrator and switch
          between test members. It is not authenticated admission or a deployed
          DAO. Test secrets remain in this tab; only public commitments and the
          group root go into local storage.
        </p>
      </aside>
      <div className="feedback" aria-live="polite">
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        {notice && <p className="success-message">{notice}</p>}
      </div>
      <div className="two-column">
        <section className="panel">
          <p className="eyebrow">Test members</p>
          <h2>Five identities. One group.</h2>
          {identities.length === 0 ? (
            <>
              <p>
                Generate five random Semaphore identities on this device and
                admit their public commitments to a fresh local group.
              </p>
              <button
                className="button primary"
                onClick={() =>
                  run(() => {
                    if (localStorage.getItem(GROUP_STORAGE_KEY))
                      throw new Error(
                        "A public demo group already exists. Reset it before creating a new one.",
                      );
                    const next = Array.from({ length: 5 }, createIdentity);
                    const snapshot = buildSnapshot(
                      next.map((item) => item.commitment.toString()),
                    );
                    sessionStorage.setItem(
                      DEMO_KEY,
                      JSON.stringify(next.map((item) => item.export())),
                    );
                    try {
                      persistGroup(snapshot);
                    } catch (cause) {
                      sessionStorage.removeItem(DEMO_KEY);
                      throw cause;
                    }
                    setIdentities(next);
                    setNotice(
                      "Five real identities generated and their public commitments admitted locally.",
                    );
                  })
                }
              >
                Create five-member demo
              </button>
            </>
          ) : (
            <ul className="member-list">
              {identities.map((identity, index) => (
                <li key={identity.commitment.toString()}>
                  <div>
                    <strong>Test member {index + 1}</strong>
                    <code>{identity.commitment.toString()}</code>
                  </div>
                  <button
                    className="button secondary"
                    onClick={() =>
                      run(() => {
                        if (sessionStorage.getItem(IDENTITY_SESSION_KEY))
                          throw new Error(
                            "An identity is already active. Back it up and clear it on the Membership page before switching.",
                          );
                        saveIdentity(sessionStorage, identity);
                        setNotice(
                          "Test member selected. Open Membership to view the public commitment.",
                        );
                      })
                    }
                  >
                    Use member {index + 1}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="actions">
            <Link className="button secondary" href="/membership">
              Open membership
            </Link>
          </div>
          <div className="danger-zone">
            {!resetConfirm ? (
              <button
                className="text-button"
                onClick={() => setResetConfirm(true)}
              >
                Reset local demo workspace
              </button>
            ) : (
              <>
                <p>
                  This clears the demo group and its five test secrets from this
                  tab. An active membership identity is kept separately.
                </p>
                <button
                  className="button secondary"
                  onClick={() =>
                    run(() => {
                      localStorage.removeItem(GROUP_STORAGE_KEY);
                      sessionStorage.removeItem(DEMO_KEY);
                      setGroup(null);
                      setIdentities([]);
                      setResetConfirm(false);
                      setNotice(
                        "Local demo reset. Your active membership identity was kept.",
                      );
                    })
                  }
                >
                  Confirm reset demo
                </button>{" "}
                <button
                  className="text-button"
                  onClick={() => setResetConfirm(false)}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </section>
        <section className="panel">
          <p className="eyebrow">Public membership registry</p>
          <h2>{group ? group.commitments.length : 0} approved locally</h2>
          {group && (
            <>
              <label className="field-label" htmlFor="group-root">
                Current group root
              </label>
              <textarea
                id="group-root"
                className="commitment"
                readOnly
                value={group.root}
                rows={3}
              />
              <details>
                <summary>View public commitments</summary>
                <ol className="commitment-list">
                  {group.commitments.map((value) => (
                    <li key={value}>
                      <code>{value}</code>
                    </li>
                  ))}
                </ol>
              </details>
            </>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              run(() => {
                if (!group) throw new Error("Create the demo group first.");
                const stored = localStorage.getItem(GROUP_STORAGE_KEY);
                if (!stored)
                  throw new Error("Group missing. Reload this page.");
                const current = readSnapshot(stored);
                if (current.root !== group.root)
                  throw new Error(
                    "The group changed in another tab. Reload before approving.",
                  );
                persistGroup(
                  buildSnapshot([...current.commitments, commitment.trim()]),
                );
                setCommitment("");
                setNotice(
                  "Public commitment admitted to the local demo group.",
                );
              });
            }}
          >
            <label className="field-label" htmlFor="admit-commitment">
              Admit another public commitment
            </label>
            <textarea
              id="admit-commitment"
              required
              value={commitment}
              onChange={(e) => setCommitment(e.target.value)}
              rows={3}
              maxLength={77}
              placeholder="Paste a public commitment"
            />
            <button className="button primary" type="submit">
              Approve locally
            </button>
          </form>
          <p className="stage-note">
            The root changes when membership changes. Voting proposals will
            require an immutable snapshot; this editable local registry is not
            an eligibility authority for live votes.
          </p>
        </section>
      </div>
    </>
  );
}
export function DemoPanel() {
  return (
    <BrowserReady>
      <DemoWorkspace />
    </BrowserReady>
  );
}
