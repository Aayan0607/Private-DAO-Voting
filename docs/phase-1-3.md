# Phase 1.3 — real proof workflow

## What is implemented

Identity → encrypted backup → local admission → frozen group snapshot → Yes/No choice → real Semaphore Groth16 proof → verification → optional local duplicate-protected receipt.

Proofs run in a dedicated browser worker with cancellation and a three-minute timeout. Private identity data crosses only the same-origin worker boundary; it is not submitted to an API. The browser fetches circuit files from the app itself. Verification can be repeated with public proof JSON and does not require the identity.

Semaphore packages are pinned to 4.14.5. That package specifies proving artifacts version 4.13.0, which is intentional. Depth 6 covers the local group's maximum of 50 members. The downloader uses the official artifact host; SHA-256 hashes are pinned in proof-artifacts.json. Initial hashes were recorded from the HTTPS downloads, not independently attested by another source.

## Try it

1. Start the app with ENABLE_LOCAL_DEMO=true.
2. Create/restore an identity and save an encrypted backup.
3. Copy the public membership ID. Open local group setup, generate a group if needed, and admit that ID.
4. Continue to the zero-knowledge proof step.
5. Start a round to freeze membership, choose Yes or No, and generate the proof.
6. Record the verified demo ballot, then try submitting again.
7. Expand verification tools and test an altered ballot, or paste a downloaded proof.
8. Start another round to demonstrate that the same member can participate again.

No Rust or circuit compilation is required. Development and build commands automatically prepare artifacts. First setup needs network access; subsequent runs verify the cached files.

## Verification boundaries

The verifier requires the expected depth, exact frozen group root, canonical local round scope and selected choice before cryptographic verification. Changing a choice does not grant a new nullifier in the same round. Scope is the integer encoding of pdv:local:v1:workshop:<round>. Phase 2 must replace the LOCAL domain with a contract-enforced chain/deployment/proposal domain.

The public proof includes message, root, scope, nullifier and proof points. It does not include the identity secret or individual commitment. Choices remain public; this is not encrypted voting.

The group, round and receipt ledger are editable local browser data. They are not authenticated admission, cross-browser duplicate protection or a deployed DAO. Clearing storage bypasses local receipts; races across tabs are not a security boundary. Production enforcement belongs in the voting contract and relay. Small groups, timing and shared-device metadata still affect anonymity.

## Automated validation

The integration test generates real proofs using the same artifacts. It checks:

- Valid-member proof and public-only proof shape.
- Altered ballot and group root fail cryptographic verification.
- Different context/choice and unsupported proof fields are rejected.
- Duplicate receipt and changed-choice duplicate rejection.
- Outsider proof generation failure.
- A new round has a different nullifier and accepts the same identity.
- Frozen membership remains unchanged after new admissions.

Run npm run check, npm run test:proof, and npm run build. Tests use only synthetic identities. No live vote is submitted.

## MST preliminary checks — 29 October 2026

Read-only JSON-RPC requests to https://testnetrpc.mstblockchain.com returned:

- eth_chainId: 0x5752035 (91562037).
- eth_blockNumber: 0x65b4c7.
- eth_call to pairing precompile address 0x08 with empty input: 32-byte value 1.

This establishes RPC responsiveness and the empty-input pairing response only. It does NOT establish successful Semaphore verifier deployment, nontrivial proof verification, transaction gas requirements or full EVM compatibility. A deployed-verifier test transaction remains Phase 2 work. No funding or transaction was requested.

## Dependencies

Patched transitive ws and underscore versions are pinned. snarkjs is aligned to Semaphore's 0.7.5, including an old transitive circuit-testing dependency; no circuits were compiled or replaced.

## Observed results

All 13 automated tests passed, including the real-proof integration test. The production build passed. In the browser, a newly admitted identity generated a real proof; its local receipt was accepted, repeat submission was rejected, and the altered-ballot check rejected the changed choice. The public proof JSON was also exercised through the standalone verification controls.
