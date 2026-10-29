# MVP validation — 29 October 2026

- npm run check: passed lint, TypeScript and 16 unit/cryptographic integration tests.
- npm run build: passed; final build has no Turbopack warnings. Runtime snapshot files are explicitly excluded from build tracing and must exist on the running server.
- npm run test:e2e: passed against the development server and production preview. The browser console had no React/runtime errors during the exercised workflow.
- Input regression: restore file input, create identity, encrypted backup download, clear identity and restore backup all passed with no uncontrolled/controlled warning.
- End-to-end: approved identity, immutable proposal, genuine browser-worker proof, simulated then submitted relay transaction, confirmed receipt and chain-derived tally.
- A second identity cast No after the first identity cast Yes; final tally was 1–1. It did not inherit the first identity's receipt display.
- Invalid/altered proof, duplicate vote, non-member UI denial, cross-origin requests and oversized bodies were rejected.
- Refresh recovered the actual receipt; mobile viewport at 390 pixels had no horizontal overflow. Desktop and mobile screenshots were inspected.
- npm run test:disabled: passed. Disabled demo mode returns 404 for /admin, /demo and /proof, rejects proposal publication, omits demo navigation and retains /membership.
- npm audit --omit=dev: zero vulnerabilities. The 19 existing development-tool advisories remain documented in phase-2-1.md.

The contract acceptance suite uses real proofs against a deployed local verifier, including deadline, changed-choice duplicate, wrong root and cross-proposal/deployment replay checks. These tests are not a security audit.

The test browser contexts were disposable. Test proposals were created on the local chain; a fresh local deployment is prepared afterwards for the user's demonstration. Existing chain history is retained, not reset. No GitHub push, external deployment or MST transaction was performed in this turn.

Video capture was not approved. scripts/record-demo.mjs and docs/demo-script.md are prepared; no finished video is claimed. To record later, run the production preview on localhost:3001 and then npm run demo:record. The recording script has not been executed or validated. Its output, when run successfully, is a silent local-chain walkthrough in demo-media; add narration using the provided script.
