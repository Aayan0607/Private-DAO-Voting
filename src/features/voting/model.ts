import { readSnapshot, type MembershipSnapshot } from "../membership/group";
import { parseProof } from "../proofs/context";
export const votingAbi = [
  "function administrator() view returns (address)",
  "function proposalCount() view returns (uint256)",
  "function proposals(uint256) view returns (string title,uint256 root,uint64 opensAt,uint64 closesAt,uint256 yes,uint256 no)",
  "function scopeForProposal(uint256) view returns (uint256)",
  "function usedNullifiers(uint256,uint256) view returns (bool)",
  "function createProposal(string,uint256,uint64,uint64) returns (uint256)",
  "function vote(uint256,uint8,uint256,uint256[8])",
  "event VoteAccepted(uint256 indexed id,uint256 nullifier,uint8 choice)",
  "event ProposalCreated(uint256 indexed id,string title,uint256 root,uint64 opensAt,uint64 closesAt)",
];
export interface Proposal {
  id: string;
  title: string;
  root: string;
  scope: string;
  opensAt: number;
  closesAt: number;
  yes: number;
  no: number;
  snapshot: MembershipSnapshot | null;
}
export interface Board {
  chainId: number;
  address: string;
  network: string;
  blockNumber: number;
  timestamp: number;
  proposals: Proposal[];
}
export function proposalId(value: unknown): string {
  if (typeof value !== "string" || !/^[1-9][0-9]{0,8}$/.test(value))
    throw new Error("Invalid proposal ID.");
  return value;
}
export function validateBallot(value: unknown, proposal: Proposal) {
  const proof = parseProof(value);
  if (
    proof.merkleTreeRoot !== proposal.root ||
    proof.scope !== proposal.scope ||
    !["1", "2"].includes(proof.message)
  )
    throw new Error("The proof does not match this proposal and ballot.");
  return proof;
}
export function validateSnapshot(proposal: Proposal) {
  if (!proposal.snapshot)
    throw new Error(
      "The administrator has not published this membership list.",
    );
  const snapshot = readSnapshot(JSON.stringify(proposal.snapshot));
  if (snapshot.root !== proposal.root)
    throw new Error("Membership list does not match the on-chain root.");
  return snapshot;
}
