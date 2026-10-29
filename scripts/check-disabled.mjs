import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const origin = "http://127.0.0.1:3002";
try {
  await fetch(origin, { signal: AbortSignal.timeout(500) });
  throw new Error("Port 3002 is already in use; stop this check.");
} catch (e) {
  if (e.message.includes("already in use")) throw e;
}
const app = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3002",
  ],
  {
    windowsHide: true,
    stdio: "ignore",
    env: {
      ...process.env,
      ENABLE_LOCAL_DEMO: "false",
      VOTING_RPC_URL: "",
      VOTING_CHAIN_ID: "",
      VOTING_CONTRACT_ADDRESS: "",
      APP_ORIGIN: "",
    },
  },
);
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      ready = (await fetch(origin, { signal: AbortSignal.timeout(500) })).ok;
      if (ready) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  assert.ok(ready, "Disabled-mode server did not start");
  for (const path of ["/admin", "/demo", "/proof"])
    assert.equal((await fetch(origin + path)).status, 404, path);
  assert.equal((await fetch(origin + "/membership")).status, 200);
  assert.equal((await fetch(origin + "/api/voting")).status, 503);
  const denied = await fetch(origin + "/api/voting/proposals", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(denied.status, 403);
  assert.ok(
    !(await (await fetch(origin)).text()).includes(
      "Prepare local demonstration",
    ),
  );
  console.log(
    "PASS: disabled demo has no administration, group or proof-lab access; membership remains available.",
  );
} finally {
  app.kill();
}
