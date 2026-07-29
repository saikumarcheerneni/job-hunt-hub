import { supabase } from "@/integrations/supabase/client";

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

/** Legacy browser-only storage, kept so existing jobs can be moved to the cloud. */
export function loadLocalJobs(): Job[] {
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

export function clearLocalJobs() {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}

type Row = {
  id: string;
  title: string;
  company: string;
  description: string | null;
  status: JobStatus;
  created_at: string;
};

const toJob = (r: Row): Job => ({
  id: r.id,
  title: r.title,
  company: r.company,
  description: r.description ?? "",
  status: r.status,
  createdAt: r.created_at,
});

export async function fetchJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, company, description, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(toJob);
}

export async function createJob(
  userId: string,
  input: { title: string; company: string; description: string; status: JobStatus },
) {
  const { error } = await supabase.from("jobs").insert({ ...input, user_id: userId });
  if (error) throw error;
}

export async function updateJobStatus(id: string, status: JobStatus) {
  const { error } = await supabase.from("jobs").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteJob(id: string) {
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) throw error;
}

/** One-time move of jobs saved before cloud sync existed. */
export async function importLocalJobs(userId: string) {
  const local = loadLocalJobs();
  if (local.length === 0) return 0;
  const { error } = await supabase.from("jobs").insert(
    local.map((j) => ({
      user_id: userId,
      title: j.title,
      company: j.company,
      description: j.description,
      status: j.status,
    })),
  );
  if (error) throw error;
  clearLocalJobs();
  return local.length;
}
