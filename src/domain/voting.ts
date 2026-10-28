/** Public domain data only. Identity secrets must never enter these types. */
export type BallotChoice = "yes" | "no";
export type ProposalStatus = "upcoming" | "open" | "closed";
export interface Proposal {
  id: string;
  title: string;
  description: string;
  opensAt: number;
  closesAt: number;
  /** Fixed snapshot commitment; null until an actual group is attached. */
  membershipRoot: string | null;
}
export interface Tally {
  yes: number;
  no: number;
}
/** UI convenience only. The future contract remains authoritative on deadlines. */
export function proposalStatus(
  proposal: Proposal,
  now: number,
): ProposalStatus {
  if (
    !Number.isFinite(now) ||
    !Number.isFinite(proposal.opensAt) ||
    !Number.isFinite(proposal.closesAt) ||
    proposal.closesAt <= proposal.opensAt
  ) {
    throw new Error("Invalid proposal time window");
  }
  if (now < proposal.opensAt) return "upcoming";
  if (now >= proposal.closesAt) return "closed";
  return "open";
}
export function summarizeTally(tally: Tally) {
  if (
    ![tally.yes, tally.no].every(
      (value) => Number.isSafeInteger(value) && value >= 0,
    )
  ) {
    throw new Error("Vote counts must be non-negative safe integers");
  }
  const total = tally.yes + tally.no;
  if (!Number.isSafeInteger(total))
    throw new Error("Vote total exceeds supported range");
  return {
    total,
    yesPercent: total === 0 ? 0 : (tally.yes / total) * 100,
    noPercent: total === 0 ? 0 : (tally.no / total) * 100,
  };
}
