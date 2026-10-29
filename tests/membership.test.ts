import assert from "node:assert/strict";
import test from "node:test";
import {
  createIdentity,
  importIdentity,
  loadIdentity,
  saveIdentity,
  IDENTITY_SESSION_KEY,
} from "../src/features/membership/identity";
import {
  encryptBackup,
  decryptBackup,
} from "../src/features/membership/backup";
import { buildSnapshot, readSnapshot } from "../src/features/membership/group";

test("random identities are distinct; session restore preserves commitment", () => {
  const first = createIdentity(),
    second = createIdentity();
  assert.notEqual(first.commitment, second.commitment);
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
  assert.equal(loadIdentity(storage), null);
  saveIdentity(storage, first);
  assert.equal(loadIdentity(storage)?.commitment, first.commitment);
  assert.deepEqual([...data.keys()], [IDENTITY_SESSION_KEY]);
  assert.equal(importIdentity(first.export()).commitment, first.commitment);
});
test("malformed identity data is rejected rather than silently replaced", () => {
  for (const bad of ["", "password", {}, null, "a".repeat(200)])
    assert.throws(() => importIdentity(bad));
});
test("encrypted backup restores identity; randomized encryption hides the secret", async () => {
  const identity = createIdentity();
  const password = "test-only long passphrase";
  const first = await encryptBackup(identity, password);
  const second = await encryptBackup(identity, password);
  assert.notEqual(first, second);
  assert.ok(!first.includes(identity.export()));
  assert.ok(!first.includes(identity.commitment.toString()));
  assert.ok(!first.includes(password));
  assert.equal(
    (await decryptBackup(first, password)).commitment,
    identity.commitment,
  );
});
test("wrong password, altered ciphertext and tampered backup parameters fail", async () => {
  const text = await encryptBackup(
    createIdentity(),
    "test-only long passphrase",
  );
  await assert.rejects(decryptBackup(text, "incorrect password"));
  const altered = JSON.parse(text);
  altered.ciphertext =
    (altered.ciphertext[0] === "A" ? "B" : "A") + altered.ciphertext.slice(1);
  await assert.rejects(
    decryptBackup(JSON.stringify(altered), "test-only long passphrase"),
  );
  const changed = JSON.parse(text);
  changed.iterations = 1;
  await assert.rejects(
    decryptBackup(JSON.stringify(changed), "test-only long passphrase"),
  );
  await assert.rejects(decryptBackup("not-json", "test-only long passphrase"));
  await assert.rejects(encryptBackup(createIdentity(), "short"));
});
test("five-member group reconstructs the same root without secrets", () => {
  const identities = Array.from({ length: 5 }, createIdentity);
  const snapshot = buildSnapshot(
    identities.map((identity) => identity.commitment.toString()),
  );
  assert.equal(snapshot.commitments.length, 5);
  assert.deepEqual(readSnapshot(JSON.stringify(snapshot)), snapshot);
  for (const identity of identities)
    assert.ok(!JSON.stringify(snapshot).includes(identity.export()));
  const enlarged = buildSnapshot([
    ...snapshot.commitments,
    createIdentity().commitment.toString(),
  ]);
  assert.notEqual(enlarged.root, snapshot.root);
  assert.equal(snapshot.commitments.length, 5);
});
test("duplicate, malformed and out-of-field commitments fail; root tampering fails", () => {
  const value = createIdentity().commitment.toString();
  assert.throws(() => buildSnapshot([value, value]));
  for (const bad of ["0", "-1", " 12", "01", "1.5", "x", "9".repeat(77)])
    assert.throws(() => buildSnapshot([bad]));
  const snapshot = buildSnapshot([value]);
  assert.throws(() => readSnapshot(JSON.stringify({ ...snapshot, root: "1" })));
  assert.throws(() =>
    buildSnapshot(Array.from({ length: 51 }, (_, i) => String(i + 1))),
  );
});
test("blocked browser storage fails explicitly", () => {
  const blocked = {
    setItem() {
      throw new Error("Storage blocked");
    },
  };
  assert.throws(
    () => saveIdentity(blocked, createIdentity()),
    /Storage blocked/,
  );
});
