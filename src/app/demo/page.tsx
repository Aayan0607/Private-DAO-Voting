import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { DemoPanel } from "@/features/membership/demo-panel";
export const metadata: Metadata = {
  title: "Local demo workspace",
  robots: { index: false, follow: false },
};
export default function Demo() {
  if (process.env.ENABLE_LOCAL_DEMO !== "true") notFound();
  return (
    <Shell active="/demo">
      <section className="page-intro">
        <p className="eyebrow">Developer demonstration</p>
        <h1>
          Explore a real
          <br />
          <em>membership group.</em>
        </h1>
        <p className="lead">
          Generate test identities, inspect their public commitments, and check
          how admission changes the group.
        </p>
      </section>
      <DemoPanel />
    </Shell>
  );
}
