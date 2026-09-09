export interface MissingSkill {
  skillId: number;
  name: string;
  jobCount: number;
}

export interface SkillGapResponse {
  userId: number;
  missingSkills: MissingSkill[];
}