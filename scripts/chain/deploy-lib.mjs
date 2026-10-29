import { ContractFactory } from "ethers";
export async function deploy(artifacts, signer) {
  const libraries = {};
  for (const name of [
    "SemaphoreVerifierKeyPts",
    "SemaphoreVerifier",
    "PrivateDAOVoting",
  ]) {
    const artifact = artifacts[name];
    if (!artifact) continue;
    let bytecode = artifact.bytecode.slice(2);
    for (const refs of Object.values(artifact.links))
      for (const [library, positions] of Object.entries(refs)) {
        if (!libraries[library]) throw new Error("Missing library " + library);
        for (const { start, length } of positions)
          bytecode =
            bytecode.slice(0, start * 2) +
            libraries[library].slice(2).padStart(length * 2, "0") +
            bytecode.slice((start + length) * 2);
      }
    const contract = await new ContractFactory(
      artifact.abi,
      "0x" + bytecode,
      signer,
    ).deploy(
      ...(name === "PrivateDAOVoting" ? [libraries.SemaphoreVerifier] : []),
    );
    await contract.waitForDeployment();
    libraries[name] = await contract.getAddress();
  }
  return libraries;
}
