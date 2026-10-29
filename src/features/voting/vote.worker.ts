/// <reference lib="webworker" />
import { generateProof, verifyProof } from "@semaphore-protocol/proof";
import { Group } from "@semaphore-protocol/group";
import { importIdentity } from "../membership/identity";
import { validateSnapshot, validateBallot } from "./model";
self.onmessage = async (event: MessageEvent) => {
  try {
    const { secret, proposal, choice } = event.data;
    if (choice !== 1 && choice !== 2) throw new Error("Choose Yes or No.");
    const snapshot = validateSnapshot(proposal),
      identity = importIdentity(secret);
    if (!snapshot.commitments.includes(identity.commitment.toString()))
      throw new Error("This identity is not eligible for this proposal.");
    const proof = await generateProof(
      identity,
      new Group(snapshot.commitments.map(BigInt)),
      choice,
      proposal.scope,
      6,
      {
        wasm: new URL(
          "/proofs/semaphore-4.13.0/semaphore-6.wasm",
          self.location.origin,
        ).href,
        zkey: new URL(
          "/proofs/semaphore-4.13.0/semaphore-6.zkey",
          self.location.origin,
        ).href,
      },
    );
    validateBallot(proof, proposal);
    if (!(await verifyProof(proof)))
      throw new Error("Proof verification failed.");
    self.postMessage({ proof });
  } catch (e) {
    self.postMessage({
      error: e instanceof Error ? e.message : "Proof generation failed.",
    });
  }
};
