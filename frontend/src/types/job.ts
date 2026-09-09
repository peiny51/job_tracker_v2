export interface JobListItem {
  id: number;
  company: string;
  jobTitle: string;
  status: string;
  createdAt: string;
  preview: string;
}

export interface JobListResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: JobListItem[];
}

export interface SkillItem {
  id: number;
  name: string;
}

export interface JobDetail {
  id: number;
  company: string;
  jobTitle: string;
  jobUrl: string | null;
  status: string;
  createdAt: string;
  skills: SkillItem[];
  rawJobDescription: string;
  rawSkillTags: string | null;
}

export interface JobMatch {
  id: number;
  company: string;
  jobTitle: string;
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface CreateJobRequest {
  userId: number;
  company: string;
  jobTitle: string;
  jobUrl: string | null;
  rawSkillTags: string;
  rawJobDescription: string;
  status: string;
}


export interface JobExtractionResult {
  company: string | null;
  jobTitle: string | null;
  location: string | null;
  jobUrl: string | null;
  skills: string[];
}