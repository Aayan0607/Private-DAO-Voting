# Private DAO Voting

Built by **Aayan Tamboli**, Team **Stupefy**, for **MST Blockchain BUILDATHON #2**.

## What works

- Random Semaphore V4 identity generation in the browser.
- Public commitment display/copy and per-tab session persistence.
- Password-encrypted backup download and local restore.
- Optional local demo: five real identities, commitment admission, group root and membership lookup.

Real zero-knowledge proof generation and verification are now implemented. Voting contracts and real-proof local chain tests are implemented. Website integration, relay submission and on-chain results in the UI remain Phase 2.2. See [the proof workflow](docs/phase-1-3.md).

## Run

Node.js 22.14+ and npm are required. **Rust, Circom and snarkjs CLI installations are not needed.**

    npm ci
    npm run dev

Open http://localhost:3000. On Windows, use npm.cmd if PowerShell blocks npm.ps1.

To enable the local demonstration, copy .env.example to .env.local and set ENABLE_LOCAL_DEMO=true, then restart/rebuild. It is already enabled in this local checkout. The untracked .env.local is not committed. Demo is disabled by default for a fresh clone; do not enable it as production admission.

    npm run check
    npm run format:check
    npm run build
    npm start

## Try membership

1. Open Membership and create an identity.
2. Save its public commitment. Use a strong unique password to download an encrypted backup.
3. Refresh: the commitment stays unchanged in the same tab.
4. Clear the identity, then restore the downloaded backup using the password.
5. The restored commitment must match the original.

## Try the local demo

1. Open Demo workspace and create five members.
2. If an identity is already active, back it up and clear it before selecting a test member.
3. Choose a test member; open Membership and check demo membership.
4. Create an independent identity to observe a non-member result.
5. Copy that public commitment to the demo admission form; approve it locally and check again.
6. Duplicate admission must fail. Reset controls require confirmation.

## Privacy and storage

The active identity and demo secrets are stored in this tab's sessionStorage, in plaintext, and are never sent by application code to a server. Refresh preserves them. Closing a tab may erase them; browser restore or tab duplication may retain/copy them. Do not depend on session expiry as secure erasure. Same-origin scripts or access to the browser profile can expose secrets.

Backup files use Web Crypto AES-256-GCM with PBKDF2-SHA256 (310,000 iterations), a fresh salt and nonce. The password is not saved. There is no password recovery. No raw-secret export is offered.

Only the demo's public commitments/root are stored in localStorage. They are editable local data, not trusted authorization or proof of unique humans. The demo is opt-in and separate from ordinary identity management.

## Structure

- src/app: route-level composition.
- src/components: shared interface.
- src/features/membership: identity, encrypted recovery, public group operations and browser UI.
- src/domain: public voting rules for future integration.
- tests: identity recovery, invalid data, public group integrity and voting boundary checks.
- docs: architecture and phased implementation.

## Technology

Next.js, React, TypeScript, Semaphore V4 identity/group libraries and Web Crypto. Semaphore proofs are implemented. Solidity/Hardhat contracts are implemented and tested locally. Planned: relay integration and validated MST deployment.

See [architecture](docs/architecture.md) and [implementation plan](docs/implementation-plan.md).

Semaphore uses existing cryptography: https://docs.semaphore.pse.dev/

## Voting contracts (Phase 2.1)

The Solidity voting wrapper and real Semaphore verifier now pass local chain acceptance tests. Run npm run chain:test. See [contract setup and boundaries](docs/phase-2-1.md). Connecting the website and relay is Phase 2.2.
