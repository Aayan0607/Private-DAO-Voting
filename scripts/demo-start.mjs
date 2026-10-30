import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { JsonRpcProvider } from "ethers";
const children = [];
let stopping = false;
function launch(file, args = [], env = {}) {
  const child = spawn(process.execPath, [file, ...args], {
    stdio: "inherit",
    windowsHide: true,
    env: { ...process.env, ...env },
  });
  children.push(child);
  return child;
}
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exit();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
const rpc = "http://127.0.0.1:8545";
async function ready() {
  try {
    const response = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_chainId",
        params: [],
      }),
      signal: AbortSignal.timeout(1000),
    });
    return (await response.json()).result === "0x7a69";
  } catch {
    return false;
  }
}
if (!(await ready())) {
  const node = launch("node_modules/hardhat/internal/cli/cli.js", [
    "node",
    "--hostname",
    "127.0.0.1",
  ]);
  node.on("exit", () => {
    if (!stopping) stop();
  });
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline && !(await ready()))
    await new Promise((r) => setTimeout(r, 500));
  if (!(await ready())) {
    console.error(
      "Local chain could not start within 90 seconds. Check port 8545.",
    );
    stopping = true;
    for (const child of children) child.kill();
    process.exit(1);
  }
}
const provider = new JsonRpcProvider(rpc);
let deployed = false;
try {
  const addresses = JSON.parse(readFileSync("deployments/local.json", "utf8"));
  deployed = (await provider.getCode(addresses.PrivateDAOVoting)) !== "0x";
} catch {}
await provider.destroy();
if (!deployed) {
  const deployment = launch("scripts/chain/deploy-local.mjs");
  const code = await new Promise((r) => deployment.on("exit", r));
  if (code !== 0) throw new Error("Deployment failed.");
}
console.log(
  "Open http://localhost:3000. Local demonstration only; no real wallet is needed.",
);
const app = launch(
  "node_modules/next/dist/bin/next",
  ["dev", "--hostname", "127.0.0.1", "--port", "3000"],
  {
    ENABLE_LOCAL_DEMO: "true",
    VOTING_RPC_URL: "",
    VOTING_CHAIN_ID: "",
    VOTING_CONTRACT_ADDRESS: "",
    RELAYER_PRIVATE_KEY: "",
    APP_ORIGIN: "",
  },
);
app.on("exit", stop);
