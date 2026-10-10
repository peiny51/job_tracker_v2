export interface MissingSkill {
  skillId: number;
  name: string;
  jobCount: number;
}

export interface SkillGapResponse {
  userId: number;
  missingSkills: MissingSkill[];
}

export interface SkillGapApplication {
  id: number;
  company: string;
  jobTitle: string;
  status: string;
  createdAt: string;
}

export interface SkillGapApplicationsResponse {
  skillId: number;
  skillName: string;
  jobCount: number;
  applications: SkillGapApplication[];
}