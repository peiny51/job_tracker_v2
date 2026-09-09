import type {
  JobDetail,
  JobListResponse,
  JobMatch,
  CreateJobRequest,
  JobExtractionResult
} from "../types/job";

const API_URL = "http://localhost:5270";

export async function getJobs(
  keyword = "",
  page = 1,
  pageSize = 10
): Promise<JobListResponse> {
    //拼接query string
    // page = 2
    // pageSize = 10
    // keyword = "Toronto"
    // 上面的会变成: ?page=2&pageSize=10&keyword=Toronto
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  // 如果keyword不为空，就把keyword加到query string里
  if (keyword.trim()) {
    params.append("keyword", keyword);
  }

  const response = await fetch(
    `${API_URL}/api/applications?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to load jobs");
  }

  return response.json();
}

export async function getJob(
  id: number
): Promise<JobDetail> {
  const response = await fetch(
    `${API_URL}/api/applications/${id}`
  );

  if (!response.ok) {
    throw new Error("Failed to load job");
  }

  return response.json();
}


export async function getJobMatch(
  id: number,
  userId = 1
): Promise<JobMatch> {
  const response = await fetch(
    `${API_URL}/api/applications/${id}/match?userId=${userId}`
  );

  if (!response.ok) {
    throw new Error("Failed to load match");
  }

  return response.json();
}

export async function updateJobStatus(
  id: number,
  status: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/applications/${id}/status?status=${encodeURIComponent(status)}`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update job status");
  }
}


export async function createJob(
  job: CreateJobRequest
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/applications`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(job)
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create job");
  }
}


export async function analyzeJobPost(
  jobDescription: string
): Promise<JobExtractionResult> {

  const response = await fetch(
    `${API_URL}/api/job-extraction/analyze`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        jobDescription
      })
    }
  );

  if (!response.ok) {
    throw new Error("Failed to analyze job post");
  }

  return response.json();
}

export async function deleteJob(
  id: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/applications/${id}`,
    {
      method: "DELETE"
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete job");
  }
}