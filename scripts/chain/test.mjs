import assert from "node:assert/strict";
import hre from "hardhat";
import { BrowserProvider, Contract } from "ethers";
import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";
import { compile } from "./compile.mjs";
import { deploy } from "./deploy-lib.mjs";
async function main() {
  const artifacts = compile(),
    provider = new BrowserProvider(hre.network.provider);
  const admin = await provider.getSigner(0),
    relay = await provider.getSigner(1);
  const addresses = await deploy(artifacts, admin);
  const voting = new Contract(
    addresses.PrivateDAOVoting,
    artifacts.PrivateDAOVoting.abi,
    admin,
  );
  const identities = Array.from({ length: 5 }, () => new Identity()),
    group = new Group(identities.map((i) => i.commitment));
  const block = await provider.getBlock("latest"),
    now = block.timestamp;
  await (
    await voting.createProposal("Workshop", group.root, now, now + 3600)
  ).wait();
  await (
    await voting.createProposal("Second round", group.root, now, now + 3600)
  ).wait();
  await (
    await voting.createProposal("Future", group.root, now + 1800, now + 3600)
  ).wait();
  const files = {
    wasm: "public/proofs/semaphore-4.13.0/semaphore-6.wasm",
    zkey: "public/proofs/semaphore-4.13.0/semaphore-6.zkey",
  };
  const proof = await generateProof(
    identities[0],
    group,
    1,
    await voting.scopeForProposal(1),
    6,
    files,
  );
  const send = (id, choice, p) =>
    voting.connect(relay).vote(id, choice, p.nullifier, p.points);
  await assert.rejects(
    voting
      .connect(relay)
      .createProposal("Forbidden", group.root, now, now + 3600),
  );
  await assert.rejects(send(1, 2, proof)); // choice binding
  await assert.rejects(send(2, 1, proof)); // proposal binding
  await assert.rejects(send(3, 1, proof)); // opening time
  await assert.rejects(send(0, 1, proof));
  await assert.rejects(send(1, 3, proof));
  await assert.rejects(send(1, 1, { ...proof, points: Array(8).fill("0") }));
  const outsider = new Identity(),
    outsiderGroup = new Group([
      outsider.commitment,
      ...identities.slice(1).map((i) => i.commitment),
    ]);
  const outsiderProof = await generateProof(
    outsider,
    outsiderGroup,
    1,
    await voting.scopeForProposal(1),
    6,
    files,
  );
  await assert.rejects(send(1, 1, outsiderProof));
  const receipt = await (await send(1, 1, proof)).wait();
  assert.equal((await voting.proposals(1)).yes, 1n);
  await assert.rejects(send(1, 1, proof));
  const changed = await generateProof(
    identities[0],
    group,
    2,
    await voting.scopeForProposal(1),
    6,
    files,
  );
  await assert.rejects(send(1, 2, changed));
  const noProof = await generateProof(
    identities[1],
    group,
    2,
    await voting.scopeForProposal(1),
    6,
    files,
  );
  await (await send(1, 2, noProof)).wait();
  assert.equal((await voting.proposals(1)).no, 1n);
  const nextProof = await generateProof(
    identities[0],
    group,
    1,
    await voting.scopeForProposal(2),
    6,
    files,
  );
  await (await send(2, 1, nextProof)).wait();
  const otherAddresses = await deploy(artifacts, admin);
  const other = new Contract(
    otherAddresses.PrivateDAOVoting,
    artifacts.PrivateDAOVoting.abi,
    admin,
  );
  await (
    await other.createProposal("Other deployment", group.root, now, now + 3600)
  ).wait();
  await assert.rejects(other.vote(1, 1, proof.nullifier, proof.points));
  await hre.network.provider.send("evm_setNextBlockTimestamp", [now + 3600]);
  await hre.network.provider.send("evm_mine");
  await assert.rejects(send(1, 2, noProof));
  assert.equal((await voting.proposals(1)).yes, 1n);
  assert.equal((await voting.proposals(1)).no, 1n);
  console.log(
    "PASS: real on-chain verification, choice/root/proposal/deployment binding, unauthorized admin, invalid proofs, outsider, duplicates, changed-choice duplicate, opening/closing deadline, next-proposal participation and tally.",
  );
  console.log(
    "Successful proof verification vote gas:",
    receipt.gasUsed.toString(),
  );
}
try {
  await main();
  process.exitCode = 0;
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await globalThis.curve_bn128?.terminate();
  await hre.network.provider.send("hardhat_reset");
}
