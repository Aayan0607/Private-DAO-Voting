/** Deliberately isolated from real proposals; never submit preview data to a relay. */
export const previewProposal = {
  title: "Fund a community Solidity workshop",
  description:
    "Should the DAO support a hands-on workshop to help members build and review their first smart contract?",
  community: "Stupefy Community DAO",
  eligibleMembers: 5,
  choices: ["Yes, support it", "No, not this time"],
} as const;
