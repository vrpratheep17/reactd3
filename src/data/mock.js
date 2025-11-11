export const MOCK_DATA = {
  repos: {
    r1: { id: "r1", name: "core-lib" },
    r2: { id: "r2", name: "api-gateway" },
    r3: { id: "r3", name: "analytics-ui" },
    r4: { id: "r4", name: "infra-ops" },
  },
  people: {
    // Example shows 4 repos such that:
    // - r2 connects to multiple teams
    // - r1, r3, r4 connect to a single team each
    u1: {
      id: "u1",
      name: "Alice Smith",
      teams: [
        { id: "t1", name: "Platform", repoIds: ["r1", "r2"] },
        { id: "t2", name: "Analytics", repoIds: ["r2", "r3"] },
        { id: "t3", name: "Ops", repoIds: ["r4"] },
      ],
    },
    u2: {
      id: "u2",
      name: "Bob Johnson",
      teams: [
        { id: "t4", name: "Mobile", repoIds: ["r1"] },
      ],
    },
    u3: {
      id: "u3",
      name: "Carol Lee",
      teams: [
        { id: "t5", name: "ML", repoIds: ["r3"] },
      ],
    },
  },
};
