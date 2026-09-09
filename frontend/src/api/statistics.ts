import type { SkillGapResponse } from "../types/statistics";

const API_URL = "http://localhost:5270";

export async function getSkillGaps(
  userId: number
): Promise<SkillGapResponse> {
  const response = await fetch(
    `${API_URL}/api/statistics/skill-gaps?userId=${userId}`
  );

  if (!response.ok) {
    throw new Error("Failed to load skill gaps");
  }

  return response.json();
}