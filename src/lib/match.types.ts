export type ResumeMatch = {
  score: number;
  missingSkills: string[];
  bullets: string[];
};

export type ResumeMatchResponse =
  | { match: ResumeMatch; error: null }
  | { match: null; error: string };
