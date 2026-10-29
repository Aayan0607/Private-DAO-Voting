import { Group } from "@semaphore-protocol/group";
const field =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;
export interface MembershipSnapshot {
  version: 1;
  commitments: string[];
  root: string;
}
export function parseCommitment(value: string): string {
  if (!/^[1-9][0-9]{0,76}$/.test(value) || BigInt(value) >= field)
    throw new Error("Enter a valid public commitment.");
  return value;
}
export function buildSnapshot(
  commitments: readonly string[],
): MembershipSnapshot {
  if (commitments.length > 50)
    throw new Error("The local demo supports at most 50 memberships.");
  const members = commitments.map(parseCommitment);
  if (new Set(members).size !== members.length)
    throw new Error("This membership is already in the group.");
  const group = new Group(members.map(BigInt));
  return { version: 1, commitments: [...members], root: group.root.toString() };
}
export function readSnapshot(text: string): MembershipSnapshot {
  const data: unknown = JSON.parse(text);
  if (
    !data ||
    typeof data !== "object" ||
    !("version" in data) ||
    data.version !== 1 ||
    !("commitments" in data) ||
    !Array.isArray(data.commitments) ||
    !data.commitments.every((value: unknown) => typeof value === "string")
  )
    throw new Error("Invalid public group.");
  const snapshot = buildSnapshot(data.commitments);
  if (!("root" in data) || data.root !== snapshot.root)
    throw new Error("Public group root does not match its members.");
  return snapshot;
}
export const GROUP_STORAGE_KEY = "pdv.demo.public-group.v1";
