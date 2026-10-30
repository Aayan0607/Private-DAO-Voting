import "server-only";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Contract, JsonRpcProvider, Wallet, FetchRequest } from "ethers";
import {
  votingAbi,
  type Board,
  type Proposal,
  proposalId,
  validateBallot,
} from "./model";
import { readSnapshot } from "../membership/group";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
function input<T>(work: () => T): T {
  try {
    return work();
  } catch (e) {
    throw new ApiError(e instanceof Error ? e.message : "Invalid request.");
  }
}
const dataDir = () =>
  process.env.VOTING_DATA_DIR || path.join(process.cwd(), "data", "snapshots");
let provider: JsonRpcProvider | undefined;
let locked = false;
let requests = 0,
  resetAt = 0;
export async function connection() {
  const local =
    process.env.VERCEL !== "1" &&
    process.env.ENABLE_LOCAL_DEMO === "true" &&
    !process.env.VOTING_RPC_URL;
  let address = process.env.VOTING_CONTRACT_ADDRESS;
  const chainId = local ? 31337 : Number(process.env.VOTING_CHAIN_ID);
  if (local) {
    try {
      address = JSON.parse(
        await readFile(
          path.join(process.cwd(), "deployments/local.json"),
          "utf8",
        ),
      ).PrivateDAOVoting;
    } catch {
      throw new ApiError(
        "Start the local blockchain and run npm run chain:deploy first.",
        503,
      );
    }
  }
  if (
    !address ||
    (!local && !process.env.VOTING_RPC_URL) ||
    !Number.isSafeInteger(chainId) ||
    chainId < 1
  )
    throw new ApiError("Voting deployment is not configured.", 503);
  if (!provider) {
    const transport = new FetchRequest(
      local ? "http://127.0.0.1:8545" : process.env.VOTING_RPC_URL!,
    );
    transport.timeout = 10000;
    provider = new JsonRpcProvider(transport, undefined, { cacheTimeout: 0 });
  }
  if (Number((await provider.getNetwork()).chainId) !== chainId)
    throw new ApiError(
      "The configured blockchain does not match the deployment.",
      503,
    );
  if ((await provider.getCode(address)) === "0x")
    throw new ApiError(
      "Voting contract is missing. Redeploy after restarting the local chain.",
      503,
    );
  const contract = new Contract(address, votingAbi, provider);
  return { local, chainId, address, provider, contract };
}
export async function board(): Promise<Board> {
  const c = await connection();
  const block = await c.provider.getBlock("latest");
  if (!block) throw new ApiError("Blockchain unavailable.", 503);
  const count = Number(
    await c.contract.proposalCount({ blockTag: block.number }),
  );
  const proposals: Proposal[] = [];
  // Bounded recent-proposal listing for this prototype.
  for (let n = count; n > Math.max(0, count - 50); n--) {
    const id = String(n),
      p = await c.contract.proposals(id, { blockTag: block.number });
    let snapshot = null;
    try {
      snapshot = readSnapshot(
        process.env.VERCEL === "1"
          ? JSON.stringify(
              JSON.parse(process.env.VOTING_SNAPSHOTS_JSON || "{}")[
                p.root.toString()
              ],
            )
          : await readFile(
              path.join(
                /* turbopackIgnore: true */ dataDir(),
                p.root.toString() + ".json",
              ),
              "utf8",
            ),
      );
      if (snapshot.root !== p.root.toString()) snapshot = null;
    } catch {}
    proposals.push({
      id,
      title: p.title,
      root: p.root.toString(),
      scope: (await c.contract.scopeForProposal(id)).toString(),
      opensAt: Number(p.opensAt),
      closesAt: Number(p.closesAt),
      yes: Number(p.yes),
      no: Number(p.no),
      snapshot,
    });
  }
  return {
    chainId: c.chainId,
    address: c.address,
    network: c.local
      ? "Local blockchain"
      : c.chainId === 91562037
        ? "MST testnet"
        : "Configured EVM network",
    blockNumber: block.number,
    timestamp: block.timestamp,
    proposals,
  };
}
export function checkOrigin(request: Request, localOnly = false) {
  const origin = request.headers.get("origin");
  const allowed = process.env.APP_ORIGIN || new URL(request.url).origin;
  const loopback = (url: URL) =>
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  let localAlias = false;
  try {
    const source = new URL(origin || "invalid"),
      target = new URL(allowed);
    localAlias =
      process.env.ENABLE_LOCAL_DEMO === "true" &&
      !process.env.APP_ORIGIN &&
      loopback(source) &&
      loopback(target) &&
      source.protocol === target.protocol &&
      source.port === target.port;
  } catch {}
  if (!origin || (origin !== allowed && !localAlias))
    throw new ApiError("This request must come from the voting website.", 403);
  if (
    localOnly &&
    (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname) ||
      process.env.ENABLE_LOCAL_DEMO !== "true")
  )
    throw new ApiError("Local administration is disabled.", 403);
}
export async function jsonBody(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new ApiError("JSON required.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError("Request body required.");
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 16384) {
      await reader.cancel();
      throw new ApiError("Request too large.", 413);
    }
    parts.push(value);
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(parts).toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error("Invalid body");
    return parsed as Record<string, unknown>;
  } catch {
    throw new ApiError("Invalid JSON.");
  }
}
async function redis(command: (string | number)[]) {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  )
    throw new ApiError(
      "The hosted relay requires shared request coordination.",
      503,
    );
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.UPSTASH_REDIS_REST_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(5000),
  });
  const data = await response.json();
  if (!response.ok || data.error)
    throw new ApiError("Relay coordination unavailable.", 503);
  return data.result;
}
export async function exclusive<T>(work: () => Promise<T>): Promise<T> {
  if (process.env.VERCEL === "1") {
    const key =
      "pdv:relay:" +
      process.env.VOTING_CHAIN_ID +
      ":" +
      process.env.VOTING_CONTRACT_ADDRESS;
    const count = await redis([
      "EVAL",
      "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end; return n",
      1,
      key + ":rate",
    ]);
    if (Number(count) > 30)
      throw new ApiError("Relay limit reached. Retry in a minute.", 429);
    const token = crypto.randomUUID();
    if ((await redis(["SET", key, token, "NX", "EX", 120])) !== "OK")
      throw new ApiError(
        "The relay is processing another vote. Retry shortly.",
        429,
      );
    try {
      return await work();
    } finally {
      await redis([
        "EVAL",
        "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end",
        1,
        key,
        token,
      ]).catch(() => {});
    }
  }
  if (locked)
    throw new ApiError(
      "The relay is processing another request. Please retry shortly.",
      429,
    );
  const now = Date.now();
  if (now > resetAt) {
    requests = 0;
    resetAt = now + 60000;
  }
  if (++requests > 30)
    throw new ApiError(
      "Relay request limit reached. Please wait a minute.",
      429,
    );
  locked = true;
  try {
    return await work();
  } finally {
    locked = false;
  }
}
export async function publish(body: Record<string, unknown>) {
  const c = await connection();
  if (!c.local)
    throw new ApiError(
      "Browser administration is available only on the local chain.",
      403,
    );
  const snapshot = input(() => readSnapshot(JSON.stringify(body.snapshot)));
  if (snapshot.commitments.length < 3)
    throw new ApiError("Use at least three members.");
  if (
    typeof body.title !== "string" ||
    !body.title.trim() ||
    Buffer.byteLength(body.title.trim()) > 200
  )
    throw new ApiError("Enter a proposal title up to 200 bytes.");
  const minutes = Number(body.minutes);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 10080)
    throw new ApiError("Choose a duration between 1 minute and 7 days.");
  const signer = await c.provider.getSigner(0);
  if (
    (await c.contract.administrator()).toLowerCase() !==
    (await signer.getAddress()).toLowerCase()
  )
    throw new ApiError("Local account is not the administrator.", 403);
  // Save public membership before creating an immutable proposal; no secrets are stored.
  await mkdir(dataDir(), { recursive: true });
  await writeFile(
    path.join(dataDir(), snapshot.root + ".json"),
    JSON.stringify(snapshot),
  );
  const latest = await c.provider.getBlock("latest");
  if (!latest) throw new ApiError("Blockchain unavailable.", 503);
  const tx = await (c.contract.connect(signer) as Contract).createProposal(
    body.title.trim(),
    snapshot.root,
    latest.timestamp,
    latest.timestamp + minutes * 60,
  );
  const receipt = await tx.wait(1);
  if (receipt?.status !== 1) throw new ApiError("Proposal transaction failed.");
  return { hash: tx.hash };
}
export async function relay(body: Record<string, unknown>) {
  if (Object.keys(body).some((k) => !["id", "proof"].includes(k)))
    throw new ApiError("Only a proposal ID and public proof may be submitted.");
  const id = input(() => proposalId(body.id)),
    c = await connection();
  const data = await board(),
    proposal = data.proposals.find((p) => p.id === id);
  if (!proposal) throw new ApiError("Proposal not found.", 404);
  const proof = input(() => validateBallot(body.proof, proposal));
  if (data.timestamp < proposal.opensAt || data.timestamp >= proposal.closesAt)
    throw new ApiError("Voting is not open.");
  if (await c.contract.usedNullifiers(id, proof.nullifier))
    throw new ApiError(
      "This membership has already voted on this proposal.",
      409,
    );
  const signer = c.local
    ? await c.provider.getSigner(1)
    : process.env.RELAYER_PRIVATE_KEY
      ? new Wallet(process.env.RELAYER_PRIVATE_KEY, c.provider)
      : null;
  if (!signer) throw new ApiError("The voting relay is not configured.", 503);
  const contract = c.contract.connect(signer) as Contract;
  try {
    await contract.vote.staticCall(
      id,
      Number(proof.message),
      proof.nullifier,
      proof.points,
    );
  } catch {
    throw new ApiError(
      "The contract rejected this proof. No vote was submitted.",
    );
  }
  const tx = await contract.vote(
    id,
    Number(proof.message),
    proof.nullifier,
    proof.points,
    { gasLimit: 600000 },
  );
  // Return the real transaction hash immediately; receipt polling reconciles chain state.
  return { hash: tx.hash, id, chainId: c.chainId, address: c.address };
}
export async function receipt(hash: string) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash))
    throw new ApiError("Invalid transaction hash.");
  const c = await connection(),
    r = await c.provider.getTransactionReceipt(hash);
  if (!r) return { status: "pending" };
  if (r.to?.toLowerCase() !== c.address.toLowerCase())
    throw new ApiError("Transaction belongs to another contract.");
  if (r.status !== 1) return { status: "failed" };
  for (const log of r.logs) {
    if (log.address.toLowerCase() !== c.address.toLowerCase()) continue;
    try {
      const e = c.contract.interface.parseLog(log);
      if (e?.name === "VoteAccepted")
        return {
          status: "confirmed",
          hash,
          id: e.args.id.toString(),
          choice: Number(e.args.choice),
          nullifier: e.args.nullifier.toString(),
          blockNumber: r.blockNumber,
          chainId: c.chainId,
          address: c.address,
        };
    } catch {}
  }
  throw new ApiError("No accepted vote was found in this transaction.");
}
export function failure(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof ApiError
          ? error.message
          : "Blockchain request failed. Check the local node or network connection and retry.",
    },
    {
      status: error instanceof ApiError ? error.status : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
