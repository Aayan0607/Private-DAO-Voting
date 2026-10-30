export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { AdminPanel } from "@/features/voting/admin-panel";
export default function AdminPage() {
  if (process.env.VERCEL === "1" || process.env.ENABLE_LOCAL_DEMO !== "true")
    notFound();
  return (
    <Shell active="/admin">
      <section className="workflow-intro">
        <p className="eyebrow">Prepare a vote</p>
        <h1>
          A proposal for <em>your community.</em>
        </h1>
      </section>
      <AdminPanel />
    </Shell>
  );
}
