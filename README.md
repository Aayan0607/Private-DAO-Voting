# Private DAO Voting

Built by **Aayan Tamboli · Team Stupefy** for **MST Blockchain BUILDATHON #2**.

A working local blockchain MVP for DAO advisory decisions. Members prove eligibility with Semaphore zero-knowledge proofs, submit through a fee-paying relay, and verify public results. Identity secrets remain in the browser. **Ballots are public; membership-to-ballot links are concealed.**

## Quick start — no wallet or Rust needed

Requires Node.js 22.14+ and npm. On Windows use npm.cmd if PowerShell blocks npm.ps1.

    npm ci
    npm run demo:start

Open http://localhost:3000. The launcher starts or reuses a loopback-only Hardhat chain, deploys the real verifier and voting wrapper if absent, and starts the demo app. Close any existing Next development server for this repository before using the launcher. Stop it with Ctrl+C. Proof files are downloaded once and verified against pinned hashes.

For separate terminals:

1. Set ENABLE_LOCAL_DEMO=true in .env.local (see .env.example).
2. Run npm run chain:node in terminal 1.
3. Run npm run chain:deploy once per fresh chain in terminal 2.
4. Run npm run dev in terminal 2 and open http://localhost:3000.

The local blockchain is in memory. Restarting it erases its proposals and votes; redeploy, then publish fresh proposals. Browser identities and encrypted backups are separate. Never fund the publicly known local development accounts on a live network.

## Full demonstration

1. Choose **Prepare local demonstration** on the home page.
2. Open group setup and **Create five-member demo**. Select **Use member 1**.
3. Open membership, save an encrypted backup, and continue to membership. An existing identity must be backed up and cleared before choosing another test member.
4. Return to group setup and **Continue to proposal setup**. Publish a question with a voting duration. The current group is frozen in the contract.
5. Open voting, choose Yes or No, and **Create private voting proof**. The browser generates and verifies a genuine proof.
6. Submit the vote. The relay uses a separate funded account; the contract verifies the proof and rejects duplicate nullifiers. The page shows a real transaction hash, confirmed block and updated tally.
7. Download the receipt or refresh to recover it in this tab. Switch to another test member through membership/group setup to demonstrate a second vote.

A member added after publication cannot vote on that existing proposal. Publish another proposal to use the updated group. Results remain viewable without an identity.

## Validation

    npm run check
    npm run chain:test
    npm run build
    npx playwright install chromium
    npm run test:e2e

Browser tests require the app, deployed local chain and ENABLE_LOCAL_DEMO=true. They create fresh proposals and disposable browser identities; they do not reset your browser profile. E2E_BASE_URL can point to another local app port.

Tests cover encrypted backup recovery, the uncontrolled/controlled input regression, real browser proof generation, relay privacy, confirmed receipts and tallies, refresh recovery, mobile width, non-member denial, malformed/altered proofs, cross-origin requests, oversized bodies and duplicate submissions. Contract tests also cover proposal/deployment replay, changed-choice duplicates, opening/closing boundaries and administrative restrictions.

## Architecture

- **Browser:** React/Next.js, random Semaphore identities, encrypted backup with Web Crypto, proof worker.
- **Proof system:** Semaphore packages 4.14.5; official pinned depth-6 proving artifacts 4.13.0. No custom circuits or trusted claims of new cryptography.
- **Contracts:** Solidity 0.8.28, official Semaphore verifier, immutable per-proposal membership root, canonical scope bound to chain/contract/proposal, one nullifier per proposal.
- **Server:** Next route handlers + ethers; bounded JSON requests, origin checks, serialized relay submission, preflight contract verification. Only public proof data is submitted.
- **Storage:** public membership snapshots on disk; tally and accepted votes on chain. The snapshot is recomputed and checked against the contract before proof generation.

See [operations and boundaries](docs/operations.md), [demo narration](docs/demo-script.md), and [submission description](docs/submission.md).

## Scope and privacy

This is a **local, single-server hackathon prototype**, not a production governance service or audited contract. It performs advisory Yes/No votes, not treasury execution. The administrator controls membership; one identity does not establish one unique human. Public membership lists and public ballots remain visible. Small groups, relay timing/IP logs and external information may weaken anonymity.

Identity secrets are plaintext in sessionStorage and must remain on a trusted origin; same-origin scripts and browser access can expose them. Backups use AES-256-GCM and PBKDF2-SHA256 with 310,000 iterations. There is no password recovery. Closing a tab is not guaranteed secure erasure.

MST deployment has not been performed; a funded testnet wallet and compatibility checks are needed. Vercel frontend hosting alone cannot run the local chain. Network settings are server-only and configurable for later deployment, but the current file-based registry and in-memory relay limits require a persistent single server. See the operations guide before hosting.

Production dependencies have no known vulnerabilities in the latest checked audit; Hardhat/solc development dependencies retain 19 advisories, documented in docs/phase-2-1.md. Do not use a forced dependency upgrade without retesting the toolchain.
