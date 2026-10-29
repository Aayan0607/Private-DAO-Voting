import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { ProofPanel } from "@/features/proofs/proof-panel";
export const metadata: Metadata = { title: "Prove your membership" };
export default function ProofPage() {
  if (process.env.ENABLE_LOCAL_DEMO !== "true") notFound();
  return (
    <Shell active="/proof">
      <section className="workflow-intro">
        <p className="eyebrow">Step 4 · Zero-knowledge proof</p>
        <h1>
          Prove you belong.
          <br />
          <em>Keep your identity private.</em>
        </h1>
        <p>Create a real proof for a public Yes / No choice.</p>
      </section>
      <ProofPanel />
    </Shell>
  );
}
