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
  return p.repos;
}

export async function getTeamsByPerson(personId) {
  await delay(250);
  const p = MOCK_DATA.people[personId];
  if (!p) throw new Error("Person not found");
  return p.teams;
}

