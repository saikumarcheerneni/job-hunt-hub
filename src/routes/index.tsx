import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Briefcase, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import {
  loadJobs,
  saveJobs,
  STATUSES,
  STATUS_LABELS,
  type Job,
  type JobStatus,
} from "@/lib/jobs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Job Application Tracker — Track Every Application" },
      {
        name: "description",
        content:
          "Add jobs with title, company, and description, then filter your pipeline by saved, applied, interview, or rejected.",
      },
      { property: "og:title", content: "Job Application Tracker" },
      {
        property: "og:description",
        content:
          "Keep every job application organized by status: saved, applied, interview, rejected.",
      },
    ],
  }),
  component: Index,
});

type Filter = JobStatus | "all";

function Index() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<JobStatus>("saved");

  useEffect(() => {
    setJobs(loadJobs());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveJobs(jobs);
  }, [jobs, hydrated]);

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: jobs.length,
      saved: 0,
      applied: 0,
      interview: 0,
      rejected: 0,
    };
    for (const job of jobs) base[job.status] += 1;
    return base;
  }, [jobs]);

  const visible = useMemo(
    () => (filter === "all" ? jobs : jobs.filter((j) => j.status === filter)),
    [jobs, filter],
  );

  function addJob(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !company.trim()) return;
    setJobs((prev) => [
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        company: company.trim(),
        description: description.trim(),
        status,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setTitle("");
    setCompany("");
    setDescription("");
    setStatus("saved");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-8">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Briefcase className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Job Application Tracker</h1>
            <p className="text-sm text-muted-foreground">
              {counts.all} {counts.all === 1 ? "role" : "roles"} in your pipeline
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-6 py-10 lg:grid-cols-[22rem_1fr]">
        <section className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Add a job</h2>
          <form onSubmit={addJob} className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Product Designer"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Job description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Paste the job description here…"
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as JobStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              <Plus className="size-4" /> Add job
            </Button>
          </form>
        </section>

        <section>
          <div className="flex flex-wrap gap-2">
            {(["all", ...STATUSES] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  filter === f
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary",
                )}
              >
                {f === "all" ? "All" : STATUS_LABELS[f]}
                <span className="ml-1.5 opacity-70">{counts[f]}</span>
              </button>
            ))}
          </div>

          <ul className="mt-6 space-y-4">
            {visible.map((job) => (
              <li
                key={job.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={job.status} />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete job"
                      onClick={() => setJobs((p) => p.filter((j) => j.id !== job.id))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {job.description && (
                  <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm text-muted-foreground">
                    {job.description}
                  </p>
                )}

                <div className="mt-4">
                  <Select
                    value={job.status}
                    onValueChange={(v) =>
                      setJobs((p) =>
                        p.map((j) =>
                          j.id === job.id ? { ...j, status: v as JobStatus } : j,
                        ),
                      )
                    }
                  >
                    <SelectTrigger className="h-8 w-40 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </li>
            ))}
          </ul>

          {hydrated && visible.length === 0 && (
            <p className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              {jobs.length === 0
                ? "No jobs yet — add your first application on the left."
                : "No jobs with this status."}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
