import type { ResumeMatch } from "./match.types";

const PRIMARY_MODEL = "claude-sonnet-5";
const FALLBACK_MODEL = "claude-sonnet-4-5";

const SYSTEM_PROMPT = `You are an expert technical recruiter and resume coach.
Compare a candidate's resume against a job description.
Respond ONLY by calling the report_match tool. Be specific and concrete:
- score: 0-100 how well the resume matches this job
- missing_skills: keywords, skills or qualifications in the job description that the resume does not evidence
- bullets: 2-3 rewritten resume bullet points, tailored to this job, each starting with a strong verb and including measurable impact where plausible`;

const TOOL = {
  name: "report_match",
  description: "Report the resume/job match analysis.",
  input_schema: {
    type: "object",
    properties: {
      score: { type: "integer", description: "Match score from 0 to 100" },
      missing_skills: { type: "array", items: { type: "string" } },
      bullets: { type: "array", items: { type: "string" } },
    },
    required: ["score", "missing_skills", "bullets"],
  },
} as const;

type AnthropicContent = { type: string; name?: string; input?: unknown };

function parseMatch(input: unknown): ResumeMatch | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as { score?: unknown; missing_skills?: unknown; bullets?: unknown };
  const score = Number(raw.score);
  if (!Number.isFinite(score)) return null;
  const toStrings = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    missingSkills: toStrings(raw.missing_skills).slice(0, 12),
    bullets: toStrings(raw.bullets).slice(0, 3),
  };
}

async function callAnthropic(apiKey: string, model: string, prompt: string) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [{ role: "user", content: prompt }],
    }),
  });
}

export async function analyzeResumeMatch(input: {
  resume: string;
  title: string;
  company: string;
  description: string;
}): Promise<{ match: ResumeMatch | null; error: string | null }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { match: null, error: "Resume matching is not configured yet." };

  const prompt = [
    `JOB TITLE: ${input.title}`,
    `COMPANY: ${input.company}`,
    "",
    "JOB DESCRIPTION:",
    input.description.slice(0, 12000),
    "",
    "CANDIDATE RESUME:",
    input.resume.slice(0, 20000),
  ].join("\n");

  try {
    let res = await callAnthropic(apiKey, PRIMARY_MODEL, prompt);
    if (res.status === 404) {
      // Model id not available on this account — fall back to the latest Sonnet.
      res = await callAnthropic(apiKey, FALLBACK_MODEL, prompt);
    }

    if (!res.ok) {
      const body = await res.text();
      console.error("[match] anthropic request failed", res.status, body);
      if (res.status === 401) return { match: null, error: "The Claude API key was rejected." };
      if (res.status === 429)
        return { match: null, error: "Claude is rate limited — try again in a moment." };
      if (/credit balance is too low/i.test(body))
        return {
          match: null,
          error: "Your Anthropic account is out of credits — add credits in the Anthropic console.",
        };
      return { match: null, error: "Could not reach the resume matching service." };
    }


    const payload = (await res.json()) as { content?: AnthropicContent[] };
    const toolUse = (payload.content ?? []).find(
      (c) => c.type === "tool_use" && c.name === TOOL.name,
    );
    const match = parseMatch(toolUse?.input);
    if (!match) return { match: null, error: "Claude returned an unexpected response." };
    return { match, error: null };
  } catch (error) {
    console.error("[match] unexpected error", error);
    return { match: null, error: "Could not reach the resume matching service." };
  }
}
