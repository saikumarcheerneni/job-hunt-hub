import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchResume, saveResume } from "@/lib/profile";

export function ResumeField({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [dirty, setDirty] = useState(false);

  const resumeQuery = useQuery({ queryKey: ["resume", userId], queryFn: fetchResume });

  useEffect(() => {
    if (resumeQuery.data !== undefined && !dirty) setText(resumeQuery.data);
  }, [resumeQuery.data, dirty]);

  const saveMutation = useMutation({
    mutationFn: () => saveResume(userId, text),
    onSuccess: () => {
      setDirty(false);
      toast.success("Resume saved.");
      queryClient.invalidateQueries({ queryKey: ["resume", userId] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not save your resume."),
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <FileText className="size-5" /> My resume
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste your resume once — it&apos;s used to score how well you match each saved job.
      </p>
      <div className="mt-4 space-y-3">
        <Label htmlFor="resume" className="sr-only">
          Resume text
        </Label>
        <Textarea
          id="resume"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setDirty(true);
          }}
          placeholder="Paste your full resume text here…"
          rows={8}
        />
        <div className="flex items-center gap-3">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !dirty}>
            <Save className="size-4" /> {saveMutation.isPending ? "Saving…" : "Save resume"}
          </Button>
          {!dirty && text && <span className="text-xs text-muted-foreground">Saved</span>}
        </div>
      </div>
    </section>
  );
}
