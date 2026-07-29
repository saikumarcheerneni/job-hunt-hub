import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyzeResumeMatch } from "./match.server";
import type { ResumeMatchResponse } from "./match.types";

const schema = z.object({ jobId: z.string().uuid() });

export const matchResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }): Promise<ResumeMatchResponse> => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("resume_text")
      .eq("id", userId)
      .maybeSingle();

    const resume = profile?.resume_text?.trim() ?? "";
    if (!resume) {
      return { match: null, error: "Add your resume in your profile first." };
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("title, company, description")
      .eq("id", data.jobId)
      .maybeSingle();

    if (jobError || !job) return { match: null, error: "Job not found." };
    if (!job.description?.trim()) {
      return { match: null, error: "This job has no description to compare against." };
    }

    const { match, error } = await analyzeResumeMatch({
      resume,
      title: job.title,
      company: job.company,
      description: job.description,
    });
    if (!match) return { match: null, error: error ?? "Resume matching failed." };

    const { error: saveError } = await supabase.from("job_matches").upsert(
      {
        user_id: userId,
        job_id: data.jobId,
        score: match.score,
        missing_skills: match.missingSkills,
        bullets: match.bullets,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "job_id" },
    );
    if (saveError) console.error("[match] could not save result", saveError);

    return { match, error: null };
  });
