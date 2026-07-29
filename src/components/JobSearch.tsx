import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, ExternalLink, MapPin, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchJobs } from "@/lib/adzuna.functions";
import { createJob } from "@/lib/jobs";
import type { AdzunaResult } from "@/lib/adzuna.server";

export function JobSearch({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const search = useServerFn(searchJobs);

  const searchMutation = useMutation({
    mutationFn: () => search({ data: { keyword, location } }),
    onSuccess: (res) => {
      if (res.error) toast.error(res.error);
      else if (res.jobs.length === 0) toast("No postings matched that search.");
    },
    onError: () => toast.error("Job search failed. Please try again."),
  });

  const saveMutation = useMutation({
    mutationFn: (job: AdzunaResult) =>
      createJob(userId, {
        title: job.title,
        company: job.company,
        description: [job.location, job.description, job.url].filter(Boolean).join("\n\n"),
        status: "saved",
      }),
    onSuccess: (_data, job) => {
      setSaved((prev) => ({ ...prev, [job.id]: true }));
      toast.success(`${job.title} saved to your tracker.`);
      onSaved();
    },
    onError: () => toast.error("Could not save this job."),
  });

  const results = searchMutation.data?.jobs ?? [];

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          searchMutation.mutate();
        }}
        className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div className="space-y-2">
          <Label htmlFor="keyword">Keyword</Label>
          <Input
            id="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Product designer"
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location (Canada)</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Toronto"
            maxLength={100}
          />
        </div>
        <Button type="submit" disabled={searchMutation.isPending}>
          <Search className="size-4" /> {searchMutation.isPending ? "Searching…" : "Search"}
        </Button>
      </form>

      <ul className="space-y-4">
        {results.map((job) => (
          <li key={job.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold">{job.title}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="size-4" /> {job.company}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" /> {job.location}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {job.url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" /> View
                    </a>
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={saved[job.id] || saveMutation.isPending}
                  onClick={() => saveMutation.mutate(job)}
                >
                  <Plus className="size-4" /> {saved[job.id] ? "Saved" : "Save to tracker"}
                </Button>
              </div>
            </div>
            {job.description && (
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{job.description}</p>
            )}
          </li>
        ))}
      </ul>

      {!searchMutation.isPending && searchMutation.isSuccess && results.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No postings found — try a broader keyword or location.
        </p>
      )}
    </div>
  );
}
