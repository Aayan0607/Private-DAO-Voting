import type { Metadata } from "next";
import { Shell } from "@/components/shell";
export const metadata: Metadata = { title: "Membership" };
export default function Membership() {
  return (
    <Shell active="/membership">
      <section className="page-intro">
        <p className="eyebrow">01 / Private membership</p>
        <h1>
          Belong to the group.
          <br />
          <em>Keep your secret.</em>
        </h1>
        <p className="lead">
          Your private identity will stay on your device. Only a public
          commitment will be shared for approval.
        </p>
      </section>
      <div className="two-column">
        <section className="panel">
          <span className="tag">Coming in Phase 1.2</span>
          <h2>Your membership</h2>
          <div className="empty-state">
            <span className="large-symbol" aria-hidden="true">
              ◎
            </span>
            <h3>No identity created</h3>
            <p>
              Identity creation and storage will be connected in the next part.
              This preview does not generate or store secrets.
            </p>
            <button className="button primary" disabled>
              Create private identity — coming next
            </button>
          </div>
        </section>
        <section className="panel">
          <p className="eyebrow">Designed for separation</p>
          <h2>What stays where?</h2>
          <div className="detail-row">
            <span>On your device</span>
            <strong>Your private identity secret</strong>
            <p>
              Used locally to create a proof. Never sent to the administrator or
              relay.
            </p>
          </div>
          <div className="detail-row">
            <span>In the membership group</span>
            <strong>Your public commitment</strong>
            <p>
              Added after approval. A proposal will use a fixed snapshot of
              eligible memberships.
            </p>
          </div>
          <div className="detail-row">
            <span>In the prototype</span>
            <strong>Five test memberships</strong>
            <p>
              One approved membership gets one vote per proposal. Membership is
              not proof of a unique human.
            </p>
          </div>
        </section>
      </div>
    </Shell>
  );
}
