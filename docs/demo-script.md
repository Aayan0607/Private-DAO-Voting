# Two-to-three minute demonstration

Use the actual local app. Keep the local blockchain running throughout. A clean browser context avoids mixing identities from earlier testing. The video can be recorded with OBS or another screen recorder at 1280×720 or higher. Do not show terminal account keys, identity storage or backup passwords used for real accounts.

## 0:00–0:20 — The problem

“I am Aayan Tamboli from Team Stupefy. Private DAO Voting addresses a common governance problem: proving that someone is an eligible member without publicly linking their membership to their vote. This demo uses a local blockchain with real zero-knowledge proofs and contract transactions.”

Show the home page and its three-step journey.

## 0:20–0:45 — Membership

“Our demo administrator prepares a five-member group. Each member has a separate private identity generated in the browser. Only public commitments enter the registry. Members can encrypt and download a recovery backup; the secret never goes to our voting server.”

Create the five-member group, select a member, show identity/backup and continue. Use a disposable demonstration password.

## 0:45–1:10 — Publish a proposal

“The administrator publishes a question. The contract freezes the eligible group and deadline for this proposal. Adding someone later cannot change who was eligible for an existing vote.”

Publish “Should our DAO fund a community workshop?” and open voting. Point out the local-chain label and zero tally.

## 1:10–1:45 — Prove and vote

“I choose Yes. The browser generates a Semaphore proof that I belong to this group. The proof is bound to this choice, this proposal, this contract and this chain. Our relay pays the gas and sends only the public proof. The contract verifies it and records a proposal-specific nullifier to prevent a second vote by the same identity.”

Generate the real proof, briefly expand public proof details and submit. Wait for the confirmed receipt.

## 1:45–2:15 — Verify the result

“This transaction receipt and block number are real. The tally is read from the contract, not incremented by the browser. Refreshing preserves the confirmed result. Clearing browser storage cannot bypass duplicate prevention. Automated tests also check altered proofs, non-members, replay across proposals and expired votes.”

Show receipt, download it, refresh and point to the Yes tally. Open the public proposal details.

## 2:15–2:35 — Honest scope

“Ballots are public; what is hidden is the membership-to-ballot link. The administrator still controls admission, and network metadata can affect privacy. This is advisory voting, not treasury execution. Our next step is a validated MST testnet deployment and stronger public-service administration.”

End on the confirmed results. For a 2-minute cut, shorten membership and final scope narration. No slide-based simulation is needed.
