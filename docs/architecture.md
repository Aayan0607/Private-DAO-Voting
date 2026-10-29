# Architecture and boundaries

## Planned flow

Member browser (private identity + local proof)
→ Relay (public ballot + proof only)
→ Voting wrapper (canonical proposal checks)
→ Semaphore verifier
→ Public on-chain result

Admission is a separate administrator workflow. A proposal freezes its eligible membership group before voting begins.

## Foundation decisions

- One Next.js application rather than multiple services before they are necessary. A future relay can begin as server-only route handlers and be extracted later.
- Domain types do not import React, Next.js or Semaphore; this keeps UI and contract integration replaceable.
- Unimplemented proposal previews are removed from the interface; no placeholder data enters transaction paths.
- No wallet connection is required to browse. The future relay, not the registered member wallet, submits a ballot.
- Browser identity persistence and encrypted recovery are implemented as described in Phase 1.2 below.
- Proof libraries and artifacts will be pinned together when installed.
- No invented MST RPC URL, chain ID or verifier address. Configure only verified deployments.

## Planned invariants

1. A contract-approved, fixed membership root defines eligibility for the proposal.
2. The contract derives/enforces the expected scope; clients cannot choose a fresh scope to vote twice.
3. Scope includes deployment/chain domain and proposal identity.
4. A proof binds the canonical ballot message, including its choice.
5. An accepted nullifier cannot be reused in the same proposal.
6. Voting window checks use chain time.
7. Nullifiers isolate proposals so a member can participate again in a new proposal.
8. No private identity value crosses the browser boundary.
9. UI states reflect receipts; submitting a transaction is not yet a successful vote.

Use Semaphore's existing V4 implementation. Do not invent a second nullifier algorithm or claim this application inherits a complete audit from the underlying protocol.

## Trust and privacy

The admission authority can admit multiple memberships and is trusted to apply eligibility policy. A relay can observe timing/network information and censor submission. Public ballots are not encrypted. Tiny groups and contextual information can weaken anonymity. The MVP does not promise coercion resistance or one-person-one-vote.

## Validation scope

Current tests cover identity persistence and recovery, encrypted-backup tampering, public group consistency, and voting domain boundaries. They do not establish zero-knowledge privacy or contract correctness; those modules are not implemented yet.

## Tooling compatibility

ESLint is pinned to 9.39.5 because the React, import and accessibility plugins shipped by eslint-config-next 16.4.3 do not yet declare ESLint 10 compatibility. Version 9 emits an end-of-support warning. Revisit this development-only pin when the plugin set supports the newer major version.

## Phase 1.2 implementation

- Identity module uses browser crypto randomness and Semaphore V4. Secret-bearing calls are confined to client components and isolated tests, never server actions.
- sessionStorage holds the active identity and, only in the demo, five test secrets. It survives refresh; browser restoration/duplication can preserve it. It is not an encrypted vault.
- Encrypted backup format v1: AES-256-GCM, PBKDF2-SHA256/310000, 16-byte random salt, 12-byte random IV and fixed authenticated application context. Strict size/version checks precede decryption. Secret/password values are never logged or transmitted by the application.
- Public group operations reconstruct Semaphore's real Merkle root. They reject duplicate/out-of-field values and mismatched stored roots. These checks establish data consistency, not trusted admission.
- ENABLE_LOCAL_DEMO gates the server route and navigation. It defaults off; .env.local enables it in this checkout. Restart/rebuild when changing it. Local approval is intentionally unauthenticated test tooling, not production authorization.
- Public demo data persists separately in localStorage. Selection cannot silently overwrite an active identity. Reset keeps the active identity separate.
- Placeholder proposal route, fictional ballot, progress cards and disabled feature controls were removed.
- A same-major ws 8.21.0 override patches transitive websocket advisories introduced by the group package. No cryptographic implementation was replaced.
- Phase 1.3 will add real proofs with these identity/group primitives; Rust is not required for the existing Semaphore JavaScript workflow.

## Phase 1.3

The proof worker consumes the browser-held identity and an immutable local snapshot. Only public proofs return to the UI. All submitted proofs are checked against the selected choice, expected root/depth and canonical local scope before verification. A local receipt ledger demonstrates nullifier reuse checks, but is explicitly not a cross-tab/browser security authority. See phase-1-3.md.
