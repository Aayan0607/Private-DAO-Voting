import assert from "node:assert/strict";
import test from "node:test";
import {
  proposalStatus,
  summarizeTally,
  type Proposal,
} from "../src/domain/voting";
const proposal: Proposal = {
  id: "test",
  title: "Test",
  description: "",
  opensAt: 100,
  closesAt: 200,
  membershipRoot: null,
};
test("voting window includes opening but excludes closing instant", () => {
  assert.equal(proposalStatus(proposal, 99), "upcoming");
  assert.equal(proposalStatus(proposal, 100), "open");
  assert.equal(proposalStatus(proposal, 199), "open");
  assert.equal(proposalStatus(proposal, 200), "closed");
});
test("invalid time windows cannot appear as open", () => {
  assert.throws(() => proposalStatus({ ...proposal, closesAt: 100 }, 100));
  assert.throws(() => proposalStatus(proposal, NaN));
});
test("an empty tally has zero percentages, not NaN", () => {
  assert.deepEqual(summarizeTally({ yes: 0, no: 0 }), {
    total: 0,
    yesPercent: 0,
    noPercent: 0,
  });
});
test("public tally percentages reflect actual counts", () => {
  assert.deepEqual(summarizeTally({ yes: 3, no: 2 }), {
    total: 5,
    yesPercent: 60,
    noPercent: 40,
  });
});
test("invalid and overflowing vote counts are rejected", () => {
  for (const yes of [-1, 0.5, NaN, Infinity])
    assert.throws(() => summarizeTally({ yes, no: 0 }));
  assert.throws(() => summarizeTally({ yes: Number.MAX_SAFE_INTEGER, no: 1 }));
});
