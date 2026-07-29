import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { matchResume } from "@/lib/match.functions";
import type { ResumeMatch } from "@/lib/match.types";
import { cn } from "@/lib/utils";

function scoreTone(score: number) {
  if (score >= 75) return "text-[hsl(var(--status-interview,142_60%_35%))]";
  if (score >= 50) return "text-primary";
  return "text-destructive";
}

export function JobMatch({
  jobId,
  match,
  onMatched,
}: {
  jobId: string;
  match?: ResumeMatch;
  onMatched: () => void;
}) {
  const run = useServerFn(matchResume);

  const mutation = useMutation({
    mutationFn: () => run({ data: { jobId } }),
    onSuccess: (res) => {
      if (res.error) toast.error(res.error);
      else onMatched();
    },
    onError: () => toast.error("Resume matching failed. Please try again."),
  });

  const current = mutation.data?.match ?? match;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        <Sparkles className="size-4" />
        {mutation.isPending ? "Analysing…" : current ? "Re-run match" : "Match resume"}
      </Button>

      {current && (
        <div className="mt-4 space-y-4 rounded-xl bg-secondary/60 p-4">
          <div className="flex items-baseline gap-2">
            <span className={cn("text-3xl font-semibold", scoreTone(current.score))}>
              {current.score}
            </span>
            <span className="text-sm text-muted-foreground">/ 100 match</span>
          </div>

          {current.missingSkills.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Missing skills & keywords
              </h4>
              <ul className="mt-2 flex flex-wrap gap-2">
                {current.missingSkills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {current.bullets.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Suggested resume bullets
              </h4>
              <ul className="mt-2 space-y-2">
                {current.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2 text-sm">
                    <span aria-hidden className="text-muted-foreground">
                      •
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
