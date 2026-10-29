import fs from "node:fs";
import { JsonRpcProvider } from "ethers";
import { compile } from "./compile.mjs";
import { deploy } from "./deploy-lib.mjs";
const provider = new JsonRpcProvider("http://127.0.0.1:8545");
if ((await provider.getNetwork()).chainId !== 31337n)
  throw new Error("Local chain 31337 required.");
const addresses = await deploy(compile(), await provider.getSigner(0));
fs.mkdirSync("deployments", { recursive: true });
fs.writeFileSync(
  "deployments/local.json",
  JSON.stringify({ chainId: 31337, ...addresses }, null, 2),
);
console.log(addresses);
await provider.destroy();
