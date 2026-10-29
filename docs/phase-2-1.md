# Phase 2.1 — contract enforcement

Implemented a reusable PrivateDAOVoting contract and the actual Semaphore 4.14.5 verifier. Local deployment compiles with pinned solc 0.8.28, optimizer 200 runs and the Paris EVM target. No Rust toolchain is required.

## Rules enforced by the contract

- Only the deployment administrator creates proposals.
- A proposal fixes its membership root, title, opening time and closing time. There are no update or cancellation methods.
- Yes = 1; No = 2. Other choices fail.
- Voting opens inclusively and closes exclusively according to blockchain time.
- The contract derives scope from PRIVATE_DAO_VOTING_V1, chain ID, its address and proposal ID using abi.encode, then keccak256 shifted right 8 bits.
- The verifier uses the stored root, derived scope, chosen ballot and supplied nullifier. The caller cannot substitute a root, scope or circuit depth.
- Nullifiers must be in the scalar field and can be accepted only once per proposal.
- Only verified votes update the public tally. Anyone may submit a proof, allowing the future relay to pay gas.
- Events contain proposal, choice and nullifier, without an individual membership commitment.

The administrator is trusted to publish the intended group root. Group member data must be supplied separately for browser proof construction in Phase 2.2. This is advisory governance; no funds are held or treasury actions executed.

## Commands

    npm run chain:test
    npm run chain:compile

For a persistent local chain, run in one terminal:
npm run chain:node

In a second terminal:
npm run chain:deploy

The node binds to 127.0.0.1. The deployment command accepts only chain 31337 and writes public addresses to ignored deployments/local.json. Local Hardhat accounts are disposable development accounts, never production wallets. Restarting the chain invalidates old deployment records.

## Acceptance evidence

The test deploys and links the real verifier and voting wrapper, generates real proofs, and checks:

- Accepted Yes and No votes and exact tallies.
- Unauthorized proposal creation, nonexistent proposal and unsupported choice rejection.
- Altered ballot, malformed proof and outsider proof rejection.
- Replays against another proposal and another deployment fail.
- Duplicate and changed-choice duplicate fail.
- Before-opening and exact-closing-time rejection.
- The same identity can vote in another proposal.

A successful vote used 299613 gas in the initial local run. This is a local measurement, not an MST estimate.

## Integration boundary

The website still uses Phase 1's local proof demonstration. Phase 2.2 must fetch immutable proposal data from the chain, generate proofs using scopeForProposal(), relay transactions, and show confirmed receipts and chain tallies. Phase 1 local-scope proofs intentionally cannot be submitted to this contract.

No MST transaction or deployment has occurred. Its deployed verifier compatibility and gas testing remain pending. The wrapper has acceptance tests, not a security audit.

## Tooling advisory status

Hardhat 2.29.1 and pinned solc 0.8.28 introduce development-only transitive advisories: 19 total (11 low, 2 moderate, 6 high) in the full npm audit on 29 October 2026. Compatible npm audit fix does not resolve them; recommended top-level upgrades change major toolchain/compiler versions. Production dependency audit reports zero vulnerabilities. Local chain commands bind to loopback and compile repository sources using the pinned solc package, without Hardhat compiler downloads. These findings remain a tooling maintenance item, not a claim of an audited application.
