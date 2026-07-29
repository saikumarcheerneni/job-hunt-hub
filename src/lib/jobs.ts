export const STATUSES = ["saved", "applied", "interview", "rejected"] as const;
export type JobStatus = (typeof STATUSES)[number];

export type Job = {
  id: string;
  title: string;
  company: string;
  description: string;
  status: JobStatus;
  createdAt: string;
};

export const STATUS_LABELS: Record<JobStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  rejected: "Rejected",
};

const STORAGE_KEY = "job-tracker:jobs";

export function loadJobs(): Job[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Job[]) : [];
  } catch {
    return [];
  }
}

export function saveJobs(jobs: Job[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}
