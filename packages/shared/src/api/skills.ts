import type { Skill } from "../types/skill";

import { getApiBaseUrl } from "./client";


export async function getSkills(): Promise<Skill[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/skills`
  );

  if (!response.ok) {
    throw new Error("Failed to load skills");
  }

  return response.json();
}


export async function getUserSkills(
  userId = 1
): Promise<Skill[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/users/${userId}/skills`
  );

  if (!response.ok) {
    throw new Error("Failed to load user skills");
  }

  return response.json();
}


export async function addUserSkill(
  skillId: number,
  userId = 1
): Promise<void> {
  // Authentication is not implemented yet, so the existing demo user ID
  // remains part of the API contract for both clients.
  const response = await fetch(
    `${getApiBaseUrl()}/api/users/${userId}/skills/${skillId}`,
    {
      method: "POST"
    }
  );

  if (!response.ok) {
    throw new Error("Failed to add user skill");
  }
}


export async function removeUserSkill(
  skillId: number,
  userId = 1
): Promise<void> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/users/${userId}/skills/${skillId}`,
    {
      method: "DELETE"
    }
  );

  if (!response.ok) {
    throw new Error("Failed to remove user skill");
  }
}