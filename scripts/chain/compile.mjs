import fs from "node:fs";
import path from "node:path";
import solc from "solc";
export function compile() {
  const sources = {
    "contracts/PrivateDAOVoting.sol": {
      content: fs.readFileSync("contracts/PrivateDAOVoting.sol", "utf8"),
    },
    "@semaphore-protocol/contracts/base/SemaphoreVerifier.sol": {
      content: fs.readFileSync(
        "node_modules/@semaphore-protocol/contracts/base/SemaphoreVerifier.sol",
        "utf8",
      ),
    },
  };
  const output = JSON.parse(
    solc.compile(
      JSON.stringify({
        language: "Solidity",
        sources,
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: "paris",
          outputSelection: {
            "*": {
              "*": [
                "abi",
                "evm.bytecode.object",
                "evm.bytecode.linkReferences",
              ],
            },
          },
        },
      }),
      {
        import: (name) => {
          try {
            return {
              contents: fs.readFileSync(
                path.join("node_modules", name),
                "utf8",
              ),
            };
          } catch {
            return { error: "Import unavailable: " + name };
          }
        },
      },
    ),
  );
  const errors = (output.errors ?? []).filter((e) => e.severity === "error");
  if (errors.length)
    throw new Error(errors.map((e) => e.formattedMessage).join("\n"));
  const artifacts = {};
  for (const contracts of Object.values(output.contracts))
    for (const [name, artifact] of Object.entries(contracts)) {
      if (artifact.evm.bytecode.object)
        artifacts[name] = {
          abi: artifact.abi,
          bytecode: "0x" + artifact.evm.bytecode.object,
          links: artifact.evm.bytecode.linkReferences,
        };
    }
  fs.mkdirSync("artifacts/phase2", { recursive: true });
  for (const [name, artifact] of Object.entries(artifacts))
    fs.writeFileSync(
      "artifacts/phase2/" + name + ".json",
      JSON.stringify(artifact, null, 2),
    );
  return artifacts;
}
if (process.argv[1]?.endsWith("compile.mjs")) {
  const artifacts = compile();
  console.log("Compiled:", Object.keys(artifacts).join(", "));
}
