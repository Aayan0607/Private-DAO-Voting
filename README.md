# Private DAO Voting

Built by **Aayan Tamboli · Team Stupefy** for **MST Blockchain BUILDATHON #2**.

A working local blockchain MVP for DAO advisory decisions. Members prove eligibility with Semaphore zero-knowledge proofs, submit through a fee-paying relay, and verify public results. Identity secrets remain in the browser. **Ballots are public; membership-to-ballot links are concealed.**

## Quick start — no wallet or Rust needed

Requires Node.js 24.x, npm and internet access for the initial installation and proof-artifact download. On Windows use npm.cmd if PowerShell blocks npm.ps1.

    npm ci
    npm run demo:start

Open http://localhost:3000. The launcher starts or reuses a loopback-only Hardhat chain, deploys the real verifier and voting wrapper if absent, and starts the demo app. Close any existing Next development server for this repository before using the launcher. Stop it with Ctrl+C. Proof files are downloaded once and verified against pinned hashes.

For separate terminals:

1. Set ENABLE_LOCAL_DEMO=true in .env.local (see .env.example).
2. Run npm run chain:node in terminal 1.
3. Run npm run chain:deploy once per fresh chain in terminal 2.
4. Run npm run dev in terminal 2 and open http://localhost:3000.

The local blockchain is in memory. Restarting it erases its proposals and votes; redeploy, then publish fresh proposals. Browser identities and encrypted backups are separate. Never fund the publicly known local development accounts on a live network.

## First-time member walkthrough

Create your own identity through **Set up my membership**, save its encrypted backup and copy its public membership ID. Follow **Set up the local group**, create the five-member demo and approve your copied ID. Keep your own identity active; do not select a test member. Continue to proposal setup, publish, then open voting. The header identifies whether you are acting as a member or administrator.

## Alternative: use a generated test member

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

See [Vercel configuration and deployment prerequisites](VERCEL-SETUP.md). Local working notes in docs/ are intentionally excluded from Git.

## Scope and privacy

This is a **local, single-server hackathon prototype**, not a production governance service or audited contract. It performs advisory Yes/No votes, not treasury execution. The administrator controls membership; one identity does not establish one unique human. Public membership lists and public ballots remain visible. Small groups, relay timing/IP logs and external information may weaken anonymity.

Identity secrets are plaintext in sessionStorage and must remain on a trusted origin; same-origin scripts and browser access can expose them. Backups use AES-256-GCM and PBKDF2-SHA256 with 310,000 iterations. There is no password recovery. Closing a tab is not guaranteed secure erasure.

MST deployment has not been performed; a funded testnet wallet and compatibility checks are needed. Vercel frontend hosting alone cannot run the local chain. Network settings are server-only and configurable for later deployment, but the current file-based registry and in-memory relay limits require a persistent single server. Hosted preparation supports an environment-based public snapshot registry and shared Redis relay coordination; these services and a funded testnet deployment are not configured for the submitted hosted frontend.

Production dependencies have no known vulnerabilities in the latest checked audit; Hardhat/solc development dependencies retain 19 advisories, in the last recorded full audit. Do not use a forced dependency upgrade without retesting the toolchain.

## Submission and reviewer access

- Author: Aayan Tamboli; solo participant, Team Stupefy.
- Repository: https://github.com/Aayan0607/Private-DAO-Voting
- Hosted frontend: https://private-dao-voting-xi.vercel.app/
- Functional evaluation: clone this repository, run npm ci and npm run demo:start, and follow the demonstration above. No private credentials or real wallet are needed locally.
- MST deployment: not performed. The hosted frontend is not connected to a working public voting deployment. Local addresses are not MST contract addresses.
- Start with fresh browser data; identities, proposals and votes from the author's laptop are not included in the source repository. Keep the local chain running during evaluation.
- Stop both the app and local chain before reinstalling dependencies on Windows to avoid native-module file locks.

The application-specific workflow, interface, voting wrapper and integration are submitted as the team's project. Third-party cryptography and tooling are credited below; Semaphore's circuits, verifier and proving artifacts are not claimed as original team inventions. Organizers can inspect the implementation under src/, contracts/, scripts/ and tests/.

## Third-party credits and licenses

The principal dependencies and package-declared licenses are:

| Resource                                                                                                  | Use                                                                                           | License                                                                 |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [Semaphore](https://github.com/semaphore-protocol/semaphore), packages 4.14.5                             | Identity, membership groups, proof generation/verification and Solidity verifier              | MIT                                                                     |
| [Official Semaphore artifacts](https://snark-artifacts.pse.dev/semaphore/4.13.0), version 4.13.0, depth 6 | Upstream WASM and proving key; downloaded and hash-checked using scripts/proof-artifacts.json | Upstream Semaphore resources; retain applicable upstream terms          |
| [Next.js](https://github.com/vercel/next.js)                                                              | Web framework and server routes                                                               | MIT                                                                     |
| [React](https://github.com/facebook/react)                                                                | User interface                                                                                | MIT                                                                     |
| [ethers](https://github.com/ethers-io/ethers.js)                                                          | Blockchain reads and transactions                                                             | MIT                                                                     |
| [Hardhat](https://github.com/NomicFoundation/hardhat)                                                     | Local EVM and contract testing                                                                | MIT                                                                     |
| [solc-js](https://github.com/ethereum/solc-js)                                                            | Solidity compilation                                                                          | MIT package wrapper; compiler components retain their upstream licenses |
| [Playwright](https://github.com/microsoft/playwright)                                                     | Browser testing                                                                               | Apache-2.0                                                              |

Additional direct and transitive dependencies are recorded in package.json and package-lock.json. Their copyright notices and license files remain with the installed packages; this README does not replace those terms or relicense third-party resources. Vercel provides frontend hosting; prepared hosted relay coordination uses the Upstash Redis REST service. These services do not imply an MST deployment or endorsement.

## Reviewer edge-case checklist

- Refresh after a confirmed vote: receipt and tally persist.
- Restore the same encrypted identity in a fresh browser session and vote on the same proposal: submission is rejected, including when the choice changes.
- Create an unapproved identity: voting controls are unavailable for that proposal.
- Admit that identity after publication: the original proposal remains ineligible; a new proposal with the updated group permits participation.
- Expand the proposal details to inspect the frozen public membership list, root, scope and contract address.
- The submit screen distinguishes a pending transaction from a confirmed vote. If a connection fails after submission, check the receipt and results before retrying.

Part 1 verification includes a clean source snapshot installation and production build without local secrets or data. The launcher allows up to 90 seconds for blockchain startup on slower machines. Tests report specific exercised cases; they do not constitute a security audit.

## Online interactive preview

The hosted site offers a clearly labelled simulation at /preview and an architecture guide at /about. With no hosted contract configured, the Vercel home page leads to this preview and /vote redirects there. Sample approval, publication, voting, duplicate rejection and late admission are simulated in page memory only. No proof, wallet request, blockchain transaction or transaction receipt is created. Resetting the preview never changes real membership or voting state.

For technical evaluation, run the local MVP and its real proof/contract tests. A working frontend preview does not imply an MST deployment. The preview is separate from the real voting interface and its API.
