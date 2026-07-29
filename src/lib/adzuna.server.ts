export type AdzunaResult = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
};

type AdzunaApiJob = {
  id?: string | number;
  title?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  description?: string;
  redirect_url?: string;
};

const stripTags = (value: string) => value.replace(/<[^>]*>/g, "").trim();

export async function searchAdzunaJobs(input: { keyword: string; location: string }) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    return { jobs: [] as AdzunaResult[], error: "Job search is not configured yet." };
  }

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "20",
    "content-type": "application/json",
  });
  if (input.keyword) params.set("what", input.keyword);
  if (input.location) params.set("where", input.location);

  try {
    const res = await fetch(`https://api.adzuna.com/v1/api/jobs/ca/search/1?${params}`);
    if (!res.ok) {
      console.error("[adzuna] request failed", res.status, await res.text());
      return { jobs: [] as AdzunaResult[], error: "Could not reach the job search service." };
    }
    const payload = (await res.json()) as { results?: AdzunaApiJob[] };
    const jobs: AdzunaResult[] = (payload.results ?? []).map((j, i) => ({
      id: String(j.id ?? i),
      title: j.title ? stripTags(j.title) : "Untitled role",
      company: j.company?.display_name ?? "Unknown company",
      location: j.location?.display_name ?? "Canada",
      description: j.description ? stripTags(j.description) : "",
      url: j.redirect_url ?? "",
    }));
    return { jobs, error: null as string | null };
  } catch (error) {
    console.error("[adzuna] unexpected error", error);
    return { jobs: [] as AdzunaResult[], error: "Could not reach the job search service." };
  }
}
