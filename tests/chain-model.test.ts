import test from "node:test";
import assert from "node:assert/strict";
import {
  proposalId,
  validateBallot,
  validateSnapshot,
  type Proposal,
} from "../src/features/voting/model";
import { buildSnapshot } from "../src/features/membership/group";
const snapshot = buildSnapshot(["1", "2", "3"]);
const proposal: Proposal = {
  id: "1",
  title: "Test",
  root: snapshot.root,
  scope: "42",
  opensAt: 1,
  closesAt: 2,
  yes: 0,
  no: 0,
  snapshot,
};
const proof = {
  merkleTreeDepth: 6,
  merkleTreeRoot: snapshot.root,
  scope: "42",
  message: "1",
  nullifier: "123",
  points: Array(8).fill("1"),
};
test("relay envelope rejects root, scope, ballot and depth substitution", () => {
  assert.equal(validateBallot(proof, proposal).message, "1");
  for (const change of [
    { scope: "43" },
    { merkleTreeRoot: "1" },
    { message: "3" },
    { merkleTreeDepth: 7 },
    { points: ["1"] },
    { secret: "must-not-be-accepted" },
  ])
    assert.throws(() => validateBallot({ ...proof, ...change }, proposal));
});
test("public snapshot is recomputed before proof generation", () => {
  assert.equal(validateSnapshot(proposal).root, snapshot.root);
  assert.throws(() => validateSnapshot({ ...proposal, root: "1" }));
  assert.throws(() => validateSnapshot({ ...proposal, snapshot: null }));
});
test("proposal identifier is bounded and canonical", () => {
  assert.equal(proposalId("123"), "123");
  for (const id of [0, "0", "01", "-1", "1.0", "../1", "9999999999"])
    assert.throws(() => proposalId(id));
});
