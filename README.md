# Private DAO Voting

Private membership, public verification. Built by **Aayan Tamboli**, Team **Stupefy**, for **MST Blockchain BUILDATHON #2**.

## Current status

**Phase 1.1: foundation.** A runnable Next.js application with overview, membership and proposal preview pages, shared voting types, and development checks. The example proposal is clearly marked; there are no real votes, proofs, identities, relay submissions or deployed contracts yet.

## Run locally

Use Node.js 22.14 or newer (Node 24 LTS recommended) and npm.

    npm ci
    npm run dev

Open http://localhost:3000. No environment variables or wallet are required for this preview.

    npm run check
    npm run build
    npm start

The check command runs lint, TypeScript and domain tests. Start serves a completed production build. Use npm.cmd instead of npm on Windows if PowerShell blocks npm.ps1.

## Product scope

Approved members generate a Semaphore V4 membership proof locally and vote through a relay. A Solidity wrapper will verify the proof, enforce a proposal-specific group snapshot and voting window, bind the ballot choice, reject duplicate nullifiers, and update a public tally.

The privacy goal is to conceal the member-to-ballot link. Choices and tallies are public. Relay/network metadata can affect anonymity. An administrator approves memberships; this is not unique-human verification. Votes are advisory.

## Structure

- src/app: pages and layout; future server endpoints.
- src/components: reusable interface components.
- src/domain: framework-independent public voting types and rules.
- src/features/proposals: explicitly isolated preview content.
- src/config: application metadata and current module status.
- tests: domain checks; integration tests will be added with proof/contract modules.
- docs: implementation phases and architectural boundaries.

Keep identity secrets out of shared domain objects, logs, APIs and server code. Do not treat preview data as contract state.

## Planned technology

Next.js App Router, React, TypeScript and CSS are installed. Semaphore V4, Solidity/Hardhat and a Node-based relay are planned for later parts. MST deployment requires RPC and verifier compatibility validation; no network address or deployment is claimed yet.

See [the implementation plan](docs/implementation-plan.md) and [architecture](docs/architecture.md).

## References

- https://docs.semaphore.pse.dev/
- https://nextjs.org/docs/app
