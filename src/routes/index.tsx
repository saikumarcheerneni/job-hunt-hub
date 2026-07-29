import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, CloudUpload, LogOut, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { JobSearch } from "@/components/JobSearch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  createJob,
  deleteJob,
  fetchJobs,
  importLocalJobs,
  loadLocalJobs,
  STATUSES,
  STATUS_LABELS,
  updateJobStatus,
  type Job,
  type JobStatus,
} from "@/lib/jobs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Job Application Tracker — Synced Across Your Devices" },
      {
        name: "description",
        content:
          "Add jobs with title, company, and description, filter by status, and keep your pipeline in sync on every device.",
      },
      { property: "og:title", content: "Job Application Tracker" },
      {
        property: "og:description",
        content:
          "Track every application by status: saved, applied, interview, rejected — synced across devices.",
      },
    ],
  }),
  component: Index,
});

type Filter = JobStatus | "all";

function Index() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {loading ? (
        <p className="mx-auto max-w-5xl px-6 py-16 text-sm text-muted-foreground">Loading…</p>
      ) : user ? (
        <Tracker userId={user.id} />
      ) : (
        <SignedOut />
      )}
    </div>
  );
}

function Header() {
  const { user } = useAuth();
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-8">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Briefcase className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Job Application Tracker</h1>
            <p className="text-sm text-muted-foreground">
              {user ? `Synced as ${user.email ?? "your account"}` : "Sign in to sync your jobs"}
            </p>
          </div>
        </div>
        {user ? (
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
            <LogOut className="size-4" /> Sign out
          </Button>
        ) : (
          <Button size="sm" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}

function SignedOut() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h2 className="text-2xl font-semibold">Your pipeline, on every device</h2>
      <p className="mt-3 text-muted-foreground">
        Sign in to save your job applications to the cloud. Jobs you added on this device can be
        moved over in one click after you sign in.
      </p>
      <Button className="mt-8" asChild>
        <Link to="/auth">Get started</Link>
      </Button>
    </main>
  );
}

function Tracker({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<JobStatus>("saved");
  const [pendingLocal, setPendingLocal] = useState(0);

  useEffect(() => {
    setPendingLocal(loadLocalJobs().length);
  }, []);

  const jobsQuery = useQuery({ queryKey: ["jobs", userId], queryFn: fetchJobs });
  const jobs: Job[] = jobsQuery.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["jobs", userId] });
  const onError = (e: unknown) =>
    toast.error(e instanceof Error ? e.message : "Something went wrong");

  const addMutation = useMutation({
    mutationFn: () => createJob(userId, { title, company, description, status }),
    onSuccess: () => {
      setTitle("");
      setCompany("");
      setDescription("");
      setStatus("saved");
      invalidate();
    },
    onError,
  });

  const statusMutation = useMutation({
    mutationFn: (v: { id: string; status: JobStatus }) => updateJobStatus(v.id, v.status),
    onSuccess: invalidate,
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: invalidate,
    onError,
  });

  const importMutation = useMutation({
    mutationFn: () => importLocalJobs(userId),
    onSuccess: (count) => {
      setPendingLocal(0);
      toast.success(`${count} job${count === 1 ? "" : "s"} moved to the cloud.`);
      invalidate();
    },
    onError,
  });

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

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Tabs defaultValue="tracker">
        <TabsList className="mb-8">
          <TabsTrigger value="tracker">My tracker</TabsTrigger>
          <TabsTrigger value="search">Job search</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <JobSearch userId={userId} onSaved={invalidate} />
        </TabsContent>

        <TabsContent value="tracker" className="grid gap-8 lg:grid-cols-[22rem_1fr]">
      <section className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Add a job</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !company.trim()) return;
            addMutation.mutate();
          }}
          className="mt-5 space-y-4"
        >
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
          <Button type="submit" className="w-full" disabled={addMutation.isPending}>
            <Plus className="size-4" /> Add job
          </Button>
        </form>
      </section>

      <section>
        {pendingLocal > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-accent p-4">
            <p className="text-sm text-accent-foreground">
              {pendingLocal} job{pendingLocal === 1 ? "" : "s"} saved on this device only.
            </p>
            <Button
              size="sm"
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending}
            >
              <CloudUpload className="size-4" /> Move to cloud
            </Button>
          </div>
        )}

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
            <li key={job.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
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
                    onClick={() => deleteMutation.mutate(job.id)}
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
                    statusMutation.mutate({ id: job.id, status: v as JobStatus })
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

        {!jobsQuery.isLoading && visible.length === 0 && (
          <p className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {jobs.length === 0
              ? "No jobs yet — add your first application on the left."
              : "No jobs with this status."}
          </p>
        )}
      </section>
        </TabsContent>
      </Tabs>
    </main>
  );
}
