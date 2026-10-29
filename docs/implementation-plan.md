# Implementation plan

## Phase 1 — Identity and proof foundation

### 1.1 Application foundation

- Runnable TypeScript/Next.js app, navigation and responsive interface.
- Separate public domain rules, preview data, configuration and components.
- Lockfile, lint/type checks, meaningful deadline/tally tests.
- Clear status labels: do not simulate a successful vote or proof.
- Exit: checks and production build pass; all three routes respond.

### 1.2 Private membership

- Integrate Semaphore V4 identity and group packages.
- Generate the identity only in the browser; decide explicit storage/recovery UX.
- Keep the private secret off servers, logs, analytics and public configuration.
- Add public commitments through a development-only admission flow.
- Provide five separate demo identities; never ship a shared private key as a real voter identity.
- Exit: commitment is stable across the intended session, group membership is reproducible, and secret leakage checks pass.

### 1.3 Genuine zero-knowledge proofs

- Integrate Semaphore proof generation and verification with pinned artifact versions.
- Generate in the browser; introduce a worker if the interface would otherwise freeze.
- Define and test ballot encoding and domain/proposal-specific scope against the eventual Solidity wrapper.
- Validate approved-member and invalid-proof cases.
- Check MST RPC, chain ID, verifier/precompile support, artifacts and gas limits with an actual verification transaction. Document results rather than assuming compatibility.
- Exit: a real locally generated proof verifies, invalid proofs fail, compatibility findings are recorded.

## Phase 2 — End-to-end voting

- Deploy a reusable voting wrapper and verifier.
- Freeze membership eligibility for each proposal; enforce canonical scope/root/choice.
- Add a relay that never receives identity secrets.
- Enforce voting windows and one vote per approved membership per proposal.
- Test valid vote, duplicate, outsider, altered choice, expiry and cross-proposal isolation.
- Persist/reconcile state against chain events; chain state remains authoritative.

## Phase 3 — Demonstration and submission

- Polish member, administrator and public results experiences.
- Integrate actual deployment where supported, with honest environment labels.
- Validate accessibility, failure states, privacy boundaries and complete voting flow.
- Finalize source repository, brief description/stack and a 2–3 minute demo video.
- Include a live deployment link if available; frontend alone does not constitute a working hosted MVP.

## Extension points

Multiple DAOs, admission providers, richer proposal options and alternate EVM networks can be added behind module boundaries. Token weighting, encrypted ballots, treasury execution and custom circuits are outside this MVP; each would require a separate design and security review.

## Phase 1.1 verification — 28 October 2026

- Production build passed and generated overview, membership and proposals routes.
- TypeScript and lint passed.
- Five domain tests passed: opening/closing boundaries, invalid windows, empty tally, count percentages and invalid/overflowing counts.
- Browser navigation between all three routes was verified; overview and proposal layouts were visually inspected at desktop width.
- Dependency audit reported zero known vulnerabilities at installation.
- GitHub workflow added, but not yet run on GitHub. No code has been pushed.
- Identities, proof generation, contracts and relay remain unimplemented, as scheduled for later parts.

## Phase 1.2 verification — 28 October 2026

- Implemented real Semaphore V4 identity and public group operations using JavaScript only; no Rust toolchain.
- Added per-tab secret storage, encrypted backup/restore, and explicit confirmation before clearing local data.
- Added opt-in demo workspace with five random identities and public commitment admission.
- Removed roadmap/progress cards, the fake proposal and all disabled feature placeholders.
- Twelve automated tests, lint, TypeScript and production build passed.
- Browser checks: identity generation, refresh persistence, encrypted backup download, five-member group, independent non-member lookup, local approval and duplicate rejection.
- Public group storage is not authorization. ZK proofs and on-chain voting remain Phase 1.3/Phase 2 work.
- Disabled-demo check: /demo returned 404, the home page omitted its demo link, and /membership remained available.
- Browser confirmation controls and selecting a generated test member were also exercised.

## Phase 1.3 — 29 October 2026

Implemented real browser-worker proof generation, verification, frozen group snapshots, choice/round binding, public proof download/import and local duplicate detection. See phase-1-3.md for validation and privacy boundaries. RPC and empty pairing-precompile checks passed; actual deployed-verifier compatibility and gas testing remain Phase 2.

## Integrated MVP — 29 October 2026

Phase 2 is implemented for a local EVM: server-persisted public membership snapshots, local proposal administration, browser proof generation using the contract scope, relay submission, on-chain confirmation, receipt recovery and public results. Phase 3 interface/operations/submission material is prepared. MST deployment remains unperformed because no funded wallet is available; localhost was accepted for this submission. A 2–3 minute narration and reproducible recording script are included, but the recording command was not approved and no video was generated. See validation.md for executed checks.
