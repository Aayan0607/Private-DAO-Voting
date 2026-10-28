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
- Preview examples live in an explicitly named feature file and have no transaction execution path.
- No wallet connection is required to browse. The future relay, not the registered member wallet, submits a ballot.
- No secret storage mechanism is chosen in Part 1. Browser persistence, recovery and XSS exposure must be addressed in Part 2 of Phase 1.
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

Current tests cover public domain time boundaries and tally arithmetic only. They do not establish cryptographic privacy or contract correctness. Add integration and adversarial tests as those modules are implemented.

## Tooling compatibility

ESLint is pinned to 9.39.5 because the React, import and accessibility plugins shipped by eslint-config-next 16.4.3 do not yet declare ESLint 10 compatibility. Version 9 emits an end-of-support warning. Revisit this development-only pin when the plugin set supports the newer major version.
