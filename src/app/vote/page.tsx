export const dynamic = "force-dynamic";
import { Shell } from "@/components/shell";
import { VotePanel } from "@/features/voting/vote-panel";
export default function VotePage() {
  return (
    <Shell active="/vote">
      <section className="workflow-intro">
        <p className="eyebrow">Private DAO Voting</p>
        <h1>
          Your voice. <em>Your privacy.</em>
        </h1>
        <p>Prove you belong, cast a ballot and verify the result.</p>
      </section>
      <VotePanel demoEnabled={process.env.ENABLE_LOCAL_DEMO === "true"} />
    </Shell>
  );
}
