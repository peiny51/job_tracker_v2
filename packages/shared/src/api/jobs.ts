import type {
  JobDetail,
  JobListResponse,
  JobMatch,
  CreateJobRequest,
  JobExtractionResult
} from "../types/job";

import { getApiBaseUrl } from "./client";


export async function getJobs(keyword = "", status = "All", page = 1, pageSize = 10): Promise<JobListResponse> {
  // Build query parameters once so web and mobile use identical search, filter, and pagination behavior.
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString()
  });

  if (keyword.trim()) {
    params.append("keyword", keyword);
  }

  // "All" means no status filter, so only send status when a real status is selected.
  if (status !== "All") {
    params.append("status", status);
  }

  const response = await fetch(`${getApiBaseUrl()}/api/applications?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to load jobs");
  }

  return response.json();
}


export async function getJob(id: number): Promise<JobDetail> {
  const response = await fetch(`${getApiBaseUrl()}/api/applications/${id}`);

  if (!response.ok) {
    throw new Error("Failed to load job");
  }

  return response.json();
}


export async function getJobMatch(id: number, userId = 1): Promise<JobMatch> {
  const response = await fetch(`${getApiBaseUrl()}/api/applications/${id}/match?userId=${userId}`);

  if (!response.ok) {
    throw new Error("Failed to load match");
  }

  return response.json();
}


export async function updateJobStatus(id: number, status: string): Promise<void> {
  // The existing ASP.NET Core endpoint expects status in the query string.
  const response = await fetch(
    `${getApiBaseUrl()}/api/applications/${id}/status?status=${encodeURIComponent(status)}`,
    {
      method: "PATCH"
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update job status");
  }
}


export async function createJob(job: CreateJobRequest): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },

    // Web and mobile send exactly the same backend contract.
    body: JSON.stringify(job)
  });

  if (!response.ok) {
    throw new Error("Failed to create job");
  }
}


export async function analyzeJobPost(jobDescription: string): Promise<JobExtractionResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/job-extraction/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      jobDescription
    })
  });

  if (!response.ok) {
    throw new Error("Failed to analyze job post");
  }

  return response.json();
}


export async function deleteJob(id: number): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/applications/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Failed to delete job");
  }
}