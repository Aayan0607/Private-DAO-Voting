/// <reference lib="webworker" />
import { generateProof, verifyProof } from "@semaphore-protocol/proof";
import { Group } from "@semaphore-protocol/group";
import { importIdentity } from "../membership/identity";
import {
  assertContext,
  DEPTH,
  messageForChoice,
  parseProof,
  readContext,
  type Choice,
} from "./context";
self.onmessage = async (event: MessageEvent) => {
  try {
    const { operation, choice } = event.data as {
      operation: string;
      choice: Choice;
    };
    const context = readContext(JSON.stringify(event.data.context));
    if (operation === "generate") {
      const identity = importIdentity(event.data.secret);
      if (
        !context.snapshot.commitments.includes(identity.commitment.toString())
      )
        throw new Error(
          "This identity is not in the frozen group. Ask for admission and start a new round.",
        );
      self.postMessage({ stage: "Generating your proof on this device…" });
      const proof = await generateProof(
        identity,
        new Group(context.snapshot.commitments.map(BigInt)),
        messageForChoice(choice),
        context.scope,
        DEPTH,
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
      assertContext(proof, context, choice);
      self.postMessage({ stage: "Checking the cryptographic proof…" });
      if (!(await verifyProof(proof)))
        throw new Error("The generated proof could not be verified.");
      self.postMessage({ proof, valid: true });
    } else if (operation === "verify") {
      const proof = parseProof(event.data.proof);
      assertContext(proof, context, choice);
      if (!(await verifyProof(proof)))
        throw new Error(
          "Cryptographic verification failed. The proof or ballot may have been altered.",
        );
      self.postMessage({ proof, valid: true });
    } else {
      throw new Error("Unsupported operation.");
    }
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error
          ? error.message
          : "Proof operation failed. Please try again.",
    });
  }
};
