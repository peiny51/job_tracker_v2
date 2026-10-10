import type {
  SkillGapApplicationsResponse,
  SkillGapResponse
} from "../types/statistics";

import { getApiBaseUrl } from "./client";


export async function getSkillGaps(userId = 1): Promise<SkillGapResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/statistics/skill-gaps?userId=${userId}`);

  if (!response.ok) {
    throw new Error("Failed to load skill gap statistics");
  }

  return response.json();
}


export async function getSkillGapApplications(
  skillId: number,
  userId = 1
): Promise<SkillGapApplicationsResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/statistics/skill-gaps/${skillId}/applications?userId=${userId}`);

  if (!response.ok) {
    throw new Error("Failed to load applications for this skill");
  }

  return response.json();
}