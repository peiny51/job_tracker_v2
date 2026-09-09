import type { Skill } from "../types/skill";

const API_URL = "http://localhost:5270";


export async function getSkills(): Promise<Skill[]> {
  const response = await fetch(
    `${API_URL}/api/skills`
  );

  if (!response.ok) {
    throw new Error("Failed to load skills");
  }

  return response.json();
}


export async function getUserSkills(
  userId: number
): Promise<Skill[]> {
  const response = await fetch(
    `${API_URL}/api/users/${userId}/skills`
  );

  if (!response.ok) {
    throw new Error("Failed to load user skills");
  }

  return response.json();
}


export async function addUserSkill(
  userId: number,
  skillId: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/users/${userId}/skills/${skillId}`,
    {
      method: "POST"
    }
  );

  if (!response.ok) {
    throw new Error("Failed to add skill");
  }
}


export async function removeUserSkill(
  userId: number,
  skillId: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/users/${userId}/skills/${skillId}`,
    {
      method: "DELETE"
    }
  );

  if (!response.ok) {
    throw new Error("Failed to remove skill");
  }
}