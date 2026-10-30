# Vercel deployment

Import this repository as a Next.js project, repository root directory. Use Node 24.x, npm ci and npm run build. Proof artifacts are downloaded and hash-checked during the build. Commit scripts/proof-artifacts.json with the source.

The website can deploy before chain configuration, but voting will show a configuration error until the following are ready. Vercel cannot reach your localhost blockchain.

## Required production environment variables

- ENABLE_LOCAL_DEMO=false
- APP_ORIGIN: exact HTTPS origin of the final Vercel domain, without trailing slash. Update it if the domain changes.
- VOTING_RPC_URL: reachable testnet RPC.
- VOTING_CHAIN_ID: actual chain ID.
- VOTING_CONTRACT_ADDRESS: deployed PrivateDAOVoting contract address.
- RELAYER_PRIVATE_KEY: separate testnet-funded relay account, stored only as a server secret. Never use the publicly known Hardhat keys.
- VOTING_SNAPSHOTS_JSON: JSON object mapping proposal membership roots to public snapshot objects containing version:1, commitments:[decimal strings], root:decimal string. Copy the public snapshots from the local data/snapshots directory, not identity backups. Each must match the root of a real proposal on the target network.
- UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN: a shared Redis REST database for relay locking and rate limiting. All deployments sharing the relay wallet must use the same coordination namespace and database; use a dedicated relay wallet for this contract.

Redeploy after changing environment variables. Hosted demo administration is disabled even if accidentally enabled in settings. Proposals must be published by the deployed contract administrator; local proposals do not migrate to the testnet. The hosted public snapshot registry is immutable per deployment; update it and redeploy when publishing proposals with new groups. No filesystem writes are required for hosted voting.

## Remaining deployment prerequisites

A funded testnet administrator wallet, verifier and voting-contract deployment, published proposal and approved public snapshot are still needed. MST verifier compatibility must be demonstrated with an actual testnet vote. No testnet transaction has been performed. Redis and Vercel environment configuration have not been live-tested yet.

## Smoke check after configuration

Open /api/voting: verify the intended chain, address and proposal. Create or restore an approved identity, generate a proof, submit, and check the transaction on the target chain. Retry the same identity to confirm rejection. Verify /admin and /demo return 404. Confirm unrelated origins are rejected. Never describe a hosted frontend with an unavailable backend as a functioning public voting deployment.
