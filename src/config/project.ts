export const project = {
  name: "Private DAO Voting",
  team: "Stupefy",
  author: "Aayan Tamboli",
  mode: "Foundation preview",
} as const;
export const modules = [
  {
    number: "01",
    title: "Private membership",
    description:
      "Create a private identity on your device. Share only its public commitment for membership approval.",
    state: "Next: Phase 1.2",
  },
  {
    number: "02",
    title: "Proof of eligibility",
    description:
      "Prove that you belong to the approved group without naming which member you are.",
    state: "Planned: Phase 1.3",
  },
  {
    number: "03",
    title: "Verified voting",
    description:
      "A relay submits your ballot. The contract checks the proof and prevents repeat votes on the same proposal.",
    state: "Planned: Phase 2",
  },
] as const;
