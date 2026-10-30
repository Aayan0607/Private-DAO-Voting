export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { Shell } from "@/components/shell";
import { MemberPanel } from "@/features/membership/member-panel";
export const metadata: Metadata = { title: "Set up your membership" };
export default function Membership() {
  return (
    <Shell active="/membership">
      <section className="workflow-intro">
        <p className="eyebrow">Your membership setup</p>
        <h1>
          Let’s get you <em>ready.</em>
        </h1>
        <p>
          Follow the steps below. Your private identity stays in this browser.
        </p>
      </section>
      <MemberPanel
        demoEnabled={
          process.env.VERCEL !== "1" && process.env.ENABLE_LOCAL_DEMO === "true"
        }
      />
    </Shell>
  );
}
