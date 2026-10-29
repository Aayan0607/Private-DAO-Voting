# Private DAO Voting

**Member:** Aayan Tamboli  
**Team:** Stupefy  
**Hackathon:** MST Blockchain BUILDATHON #2  
**Primary track:** Blockchain and Web3 — on-chain verification, trust infrastructure and decentralized applications.

Private DAO Voting lets approved community members cast verifiable advisory votes without exposing which registered membership produced each ballot. Members generate their identity and a genuine Semaphore zero-knowledge proof in the browser. A relay pays transaction fees, and a Solidity contract verifies eligibility, binds the proof to the proposal and prevents duplicate voting. Public results and downloadable receipts are reconciled against the blockchain.

The working local MVP includes encrypted identity backup and recovery, demo membership administration, immutable proposal membership snapshots, Yes/No voting, real proof generation, real contract verification, duplicate-vote rejection and live chain-derived tallies. The frontend never sends identity secrets to the relay. Ballot choices are public; this project protects the membership-to-ballot link rather than encrypting ballots.

**Technology:** Next.js, React, TypeScript, Semaphore V4, Solidity, ethers, Hardhat, Web Crypto and Playwright.

**Real-world relevance:** community funding priorities, student organizations and DAO advisory decisions where members want participation privacy with independently verifiable eligibility and counting.

**Current environment:** working localhost deployment using a real local EVM and verifier. MST testnet deployment has not been claimed or performed. No real wallet is required for the demonstration. This is an unaudited prototype; administrator-controlled admission and metadata privacy remain limitations.
