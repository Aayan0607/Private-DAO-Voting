import { Shell } from "@/components/shell";
import { PreviewPanel } from "@/features/preview/preview-panel";
export default function Preview() {
  return (
    <Shell active="/preview">
      <section className="workflow-intro">
        <p className="eyebrow">Guided interactive preview</p>
        <h1>
          Explore a private <em>community vote.</em>
        </h1>
        <p>
          Walk through membership, a proposal and the rules that protect a vote.
        </p>
      </section>
      <PreviewPanel />
    </Shell>
  );
}
