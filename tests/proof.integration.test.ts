import assert from "node:assert/strict";
import { after, test } from "node:test";
import { generateProof, verifyProof } from "@semaphore-protocol/proof";
import { Group } from "@semaphore-protocol/group";
import { createIdentity } from "../src/features/membership/identity";
import { buildSnapshot } from "../src/features/membership/group";
import {
  createContext,
  assertContext,
  parseProof,
  recordNullifier,
  DEPTH,
} from "../src/features/proofs/context";
after(async () => {
  const runtime = globalThis as unknown as {
    curve_bn128?: { terminate: () => Promise<void> };
  };
  await runtime.curve_bn128?.terminate();
});
test(
  "real Groth16 proofs: valid, altered, duplicate, outsider and different-round cases",
  { timeout: 180000 },
  async () => {
    const identities = Array.from({ length: 5 }, createIdentity);
    const snapshot = buildSnapshot(
      identities.map((identity) => identity.commitment.toString()),
    );
    const context = createContext(snapshot, 1);
    const artifacts = {
      wasm: "public/proofs/semaphore-4.13.0/semaphore-6.wasm",
      zkey: "public/proofs/semaphore-4.13.0/semaphore-6.zkey",
    };
    const group = new Group(snapshot.commitments.map(BigInt));
    const proof = await generateProof(
      identities[0],
      group,
      "1",
      context.scope,
      DEPTH,
      artifacts,
    );
    assert.equal(await verifyProof(proof), true);
    assertContext(parseProof(proof), context, "yes");
    assert.ok(!JSON.stringify(proof).includes(identities[0].export()));
    assert.ok(!Object.keys(proof).includes("commitment"));
    assert.equal(await verifyProof({ ...proof, message: "2" }), false);
    assert.equal(await verifyProof({ ...proof, merkleTreeRoot: "1" }), false);
    assert.throws(() => assertContext(proof, context, "no"));
    assert.throws(() =>
      assertContext(proof, createContext(snapshot, 2), "yes"),
    );
    assert.throws(() => parseProof({ ...proof, secret: "not-allowed" }));
    const map = new Map<string, string>();
    const storage = {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => {
        map.set(key, value);
      },
    };
    recordNullifier(proof, context, storage);
    assert.throws(
      () => recordNullifier(proof, context, storage),
      /Repeat submission/,
    );
    const changedChoice = await generateProof(
      identities[0],
      group,
      "2",
      context.scope,
      DEPTH,
      artifacts,
    );
    assert.equal(await verifyProof(changedChoice), true);
    assert.equal(changedChoice.nullifier, proof.nullifier);
    assert.throws(
      () => recordNullifier(changedChoice, context, storage),
      /Repeat submission/,
    );
    await assert.rejects(
      generateProof(
        createIdentity(),
        group,
        "1",
        context.scope,
        DEPTH,
        artifacts,
      ),
    );
    const second = createContext(snapshot, 2);
    const secondProof = await generateProof(
      identities[0],
      group,
      "1",
      second.scope,
      DEPTH,
      artifacts,
    );
    assert.equal(await verifyProof(secondProof), true);
    assert.notEqual(secondProof.nullifier, proof.nullifier);
    recordNullifier(secondProof, second, storage);
    const enlarged = buildSnapshot([
      ...snapshot.commitments,
      createIdentity().commitment.toString(),
    ]);
    assert.throws(() =>
      assertContext(proof, createContext(enlarged, 1), "yes"),
    );
    assert.equal(context.snapshot.commitments.length, 5);
  },
);
