# Running and maintaining the MVP

## Local lifecycle

Use npm run demo:start for a fresh local demonstration. It uses Hardhat chain ID 31337 and disposable funded accounts. Account 0 creates proposals; account 1 relays votes. The node binds to 127.0.0.1. The application never asks a voter for an Ethereum wallet.

Manual setup is in README.md. A node restart erases blockchain state. deployments/local.json records addresses, not chain persistence. Redeploy after restarting; publish fresh proposals. Public snapshot files in data/snapshots can be retained, since they are keyed by verified Merkle roots. They do not restore erased votes.

The demo administration endpoint is enabled only when ENABLE_LOCAL_DEMO=true, no external RPC is configured, the actual chain ID is 31337, and the browser request originates from localhost or 127.0.0.1. This is not a login system. Do not expose local administrative ports through tunnels.

## Relay and confirmation

The relay accepts only a proposal ID and a strictly parsed public proof. It checks root, scope, choice, voting window and used nullifier, then performs a contract simulation before paying gas. A transaction hash means submitted; only a successful receipt containing VoteAccepted from the configured contract means confirmed. The UI polls pending transactions and offers a manual recheck. A failed HTTP response does not prove that a transaction never reached the chain; refresh results before retrying. The contract prevents double counting even after tab storage is cleared.

Thirty mutation attempts per minute and one in-flight submission per process bound this prototype's relay. These are coarse single-process controls, not distributed anti-abuse protection. Before public hosting, add durable queueing/nonce management, an external rate limiter, gas-budget monitoring, persistent snapshot storage and secured administration.

The board lists the 50 latest proposals. Counts and deadlines are read from one block snapshot. Local Hardhat blocks are mined on transactions; its latest displayed timestamp may remain stationary between transactions. Contract execution remains authoritative for deadlines.

## Credentials and hosting

No real wallet is needed for local demonstration. A public deployment needs a separately funded testnet deployment wallet, funded relay account, a verified RPC and confirmed verifier deployment. Never paste private keys into chat or place them in NEXT_PUBLIC_ variables. Use hosting secrets for RELAYER_PRIVATE_KEY, a restricted spending balance, and a separate administrator wallet.

External server settings: APP_ORIGIN (exact public origin), VOTING_RPC_URL, VOTING_CHAIN_ID, VOTING_CONTRACT_ADDRESS, RELAYER_PRIVATE_KEY, and VOTING_DATA_DIR. Publish public snapshot JSON files in the data directory, named by their root. Root mismatch is rejected. Disable ENABLE_LOCAL_DEMO on a public server. Browser-based production proposal management is intentionally unavailable; a proper authenticated wallet admission flow is future work.

The present persistent file store is suitable for a local or persistent single-instance Node server. It is not a complete Vercel/serverless deployment configuration. A Vercel migration requires durable object/database storage and a reachable chain/relay. MST compatibility still requires actual testnet verifier and vote transactions; preliminary RPC checks alone do not establish it.

## Troubleshooting

- No proposals: create a group and publish a question from the administrator workflow.
- Not eligible: use a member included when that proposal was published; later admission cannot modify a frozen proposal.
- Contract missing: the local node restarted. Redeploy and publish again.
- Proof failure: check proof files with npm run proofs:prepare, identity selection and membership snapshot. Reload after an interrupted development hot update.
- Already voted: this membership's nullifier was consumed for that proposal. Clearing browser storage cannot reset on-chain eligibility.
- Snapshot unavailable: restore the public root-named file. Never replace it with a different membership list.
- Input warning: backup and restore forms now have distinct React keys. The file input remains uncontrolled throughout its lifetime. Automated browser tests exercise both transitions.
