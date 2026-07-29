import { supabase } from "@/integrations/supabase/client";
import type { ResumeMatch } from "./match.types";

export async function fetchResume(): Promise<string> {
  const { data, error } = await supabase.from("profiles").select("resume_text").maybeSingle();
  if (error) throw error;
  return data?.resume_text ?? "";
}

export async function saveResume(userId: string, resumeText: string) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, resume_text: resumeText }, { onConflict: "id" });
  if (error) throw error;
}

export async function fetchMatches(): Promise<Record<string, ResumeMatch>> {
  const { data, error } = await supabase
    .from("job_matches")
    .select("job_id, score, missing_skills, bullets");
  if (error) throw error;
  const out: Record<string, ResumeMatch> = {};
  for (const row of data ?? []) {
    out[row.job_id] = {
      score: row.score,
      missingSkills: Array.isArray(row.missing_skills) ? (row.missing_skills as string[]) : [],
      bullets: Array.isArray(row.bullets) ? (row.bullets as string[]) : [],
    };
  }
  return out;
}
