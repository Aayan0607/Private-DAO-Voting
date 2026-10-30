# Private DAO Voting — submission summary

**Author:** Aayan Tamboli · **Team:** Stupefy (solo)

**Repository:** https://github.com/Aayan0607/Private-DAO-Voting

**Hosted frontend:** https://private-dao-voting-xi.vercel.app/

The latest preview changes must be pushed and redeployed before the hosted URL includes the interactive simulation.

## Project description

Private DAO Voting lets approved members prove voting eligibility without exposing which membership cast each ballot. The local MVP combines browser-generated Semaphore proofs, a transaction relay and a Solidity verifier-backed voting contract. It enforces frozen membership eligibility, voting deadlines and one vote per identity per proposal, with chain-derived results and transaction receipts.

## Problem and users

Public wallet-based voting can expose the link between a community member and their choices. DAOs, clubs and student organizations need verifiable eligibility and counting while reducing that exposure. The administrator approves membership; proofs conceal the individual membership-to-ballot link.

## Implemented features

Private identities, encrypted backups and recovery; local admission and proposal publication; real Semaphore proof generation; relay submission; contract verification; duplicate and outsider rejection; immutable proposal membership lists; public results and downloadable receipts. The separate online preview illustrates the workflow using explicitly simulated data and makes no blockchain or cryptographic calls.

## Stack and originality

Next.js, React, TypeScript, Semaphore V4, Solidity, ethers, Hardhat, Web Crypto and Playwright. The project-specific interface, workflows and voting wrapper integrate credited third-party technology. Semaphore cryptography and verifier resources are credited in README.md and are not claimed as original circuits.

## MST deployment status

Not deployed on MST Blockchain. Real proof verification and transactions are demonstrated on a local EVM. No MST smart-contract addresses are available. Hosted preview results are simulations, not testnet votes. Members do not need wallet connections in the local relay workflow.

## Evaluation

Use Node.js 24.x. Run npm ci and npm run demo:start, then open localhost:3000. Follow README.md to create a member, approve membership, publish and vote. npm run check, npm run chain:test and npm run test:e2e exercise the implementation. Browser tests require the local demo to be running.

## Remaining submission assets

Upload the final real-workflow video and presentation to Google Drive and set each to Anyone with the link → Viewer. Paste those actual links into the submission form. No video or presentation URL is invented here. The screen-recording command requires renewed approval; a new video has not been recorded for Part 2.
