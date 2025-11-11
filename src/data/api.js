import { MOCK_DATA } from "./mock.js";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export async function getPerson(personId) {
  await delay(250);
  const p = MOCK_DATA.people[personId];
  if (!p) throw new Error("Person not found");
  return p;
}

export async function getReposByPerson(personId) {
  await delay(250);
  const p = MOCK_DATA.people[personId];
  if (!p) throw new Error("Person not found");
  // Aggregate unique repos across the person's teams
  const set = new Set();
  for (const team of p.teams ?? []) {
    for (const rid of team.repoIds ?? []) set.add(rid);
  }
  return [...set].map((id) => MOCK_DATA.repos[id]).filter(Boolean);
}

export async function getTeamsByPerson(personId) {
  await delay(250);
  const p = MOCK_DATA.people[personId];
  if (!p) throw new Error("Person not found");
  // return just id+name for compatibility
  return (p.teams ?? []).map(({ id, name }) => ({ id, name }));
}

export async function getTeamsWithReposByPerson(personId) {
  await delay(250);
  const p = MOCK_DATA.people[personId];
  if (!p) throw new Error("Person not found");
  return (p.teams ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    repos: (t.repoIds ?? [])
      .map((rid) => MOCK_DATA.repos[rid])
      .filter(Boolean),
  }));
}
