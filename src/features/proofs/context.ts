import type { SemaphoreProof } from "@semaphore-protocol/proof";
import { readSnapshot, type MembershipSnapshot } from "../membership/group";
export const DEPTH = 6;
export const SESSION_KEY = "pdv.proof-session.v1";
export type Choice = "yes" | "no";
export interface ProofContext {
  version: 1;
  round: number;
  snapshot: MembershipSnapshot;
  scope: string;
}
export function scopeForRound(round: number): string {
  if (!Number.isSafeInteger(round) || round < 1 || round > 999999)
    throw new Error("Invalid demonstration round.");
  // Exact UTF-8-to-integer domain encoding. This is a LOCAL domain, not a chain deployment.
  const text = "pdv:local:v1:workshop:" + round;
  return BigInt(
    "0x" +
      Array.from(new TextEncoder().encode(text), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join(""),
  ).toString();
}
export function createContext(
  snapshot: MembershipSnapshot,
  round: number,
): ProofContext {
  const copy = readSnapshot(JSON.stringify(snapshot));
  if (copy.commitments.length < 3)
    throw new Error("Use at least three members for this demonstration.");
  return { version: 1, round, snapshot: copy, scope: scopeForRound(round) };
}
export function readContext(text: string): ProofContext {
  const data = JSON.parse(text);
  if (data?.version !== 1) throw new Error("Invalid proof session.");
  const context = createContext(data.snapshot, data.round);
  if (context.scope !== data.scope)
    throw new Error("Invalid proof session scope.");
  return context;
}
export function messageForChoice(choice: Choice): string {
  if (choice !== "yes" && choice !== "no") throw new Error("Choose Yes or No.");
  return choice === "yes" ? "1" : "2";
}
export function parseProof(value: unknown): SemaphoreProof {
  if (!value || typeof value !== "object")
    throw new Error("Invalid proof file.");
  const data = value as Record<string, unknown>;
  const fields = [
    "merkleTreeDepth",
    "merkleTreeRoot",
    "nullifier",
    "message",
    "scope",
    "points",
  ];
  if (
    Object.keys(data).some((key) => !fields.includes(key)) ||
    data.merkleTreeDepth !== DEPTH
  )
    throw new Error("Unsupported proof format.");
  const numeric = (v: unknown): v is string =>
    typeof v === "string" &&
    /^(0|[1-9][0-9]{0,77})$/.test(v) &&
    BigInt(v) < 1n << 256n;
  for (const key of fields.slice(1, 5))
    if (!numeric(data[key])) throw new Error("Invalid public proof input.");
  if (
    !Array.isArray(data.points) ||
    data.points.length !== 8 ||
    !data.points.every(numeric)
  )
    throw new Error("Invalid proof points.");
  return data as unknown as SemaphoreProof;
}
export function assertContext(
  proof: SemaphoreProof,
  context: ProofContext,
  choice: Choice,
) {
  if (
    proof.merkleTreeDepth !== DEPTH ||
    proof.merkleTreeRoot !== context.snapshot.root
  )
    throw new Error("Proof does not match this group's frozen snapshot.");
  if (proof.scope !== context.scope)
    throw new Error("Proof belongs to a different round.");
  if (proof.message !== messageForChoice(choice))
    throw new Error("Proof does not match the selected ballot.");
}
export function recordNullifier(
  proof: SemaphoreProof,
  context: ProofContext,
  storage: Pick<Storage, "getItem" | "setItem">,
) {
  const key = "pdv.accepted.v1:" + context.scope;
  const raw = storage.getItem(key);
  const values: unknown = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(values) || !values.every((v) => typeof v === "string"))
    throw new Error("Local receipt data is unreadable.");
  if (values.includes(proof.nullifier))
    throw new Error(
      "Repeat submission rejected: this member already submitted in this round.",
    );
  storage.setItem(key, JSON.stringify([...values, proof.nullifier]));
}
