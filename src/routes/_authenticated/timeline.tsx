import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMemories } from "@/lib/memory.functions";
import { PageHeader } from "@/components/page-shell";
import { GitBranch } from "lucide-react";

export const Route = createFileRoute("/_authenticated/timeline")({
  head: () => ({ meta: [{ title: "Knowledge Timeline — TooliVerse" }] }),
  component: TimelinePage,
});

function TimelinePage() {
  const fn = useServerFn(listMemories);
  const { data: rows = [] } = useQuery({ queryKey: ["memories-timeline"], queryFn: () => fn({ data: { limit: 200 } }) });
  const grouped: Record<string, typeof rows> = {};
  rows.forEach((r) => {
    const k = new Date(r.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    (grouped[k] ||= []).push(r);
  });

  return (
    <div>
      <PageHeader title="Knowledge Timeline" description="Workplace milestones, meetings and decisions over time." icon={GitBranch} />
      {rows.length === 0 && <div className="text-sm text-muted-foreground">Your timeline appears as you store memories.</div>}
      <div className="relative space-y-6 border-l border-border pl-6">
        {Object.entries(grouped).map(([day, items]) => (
          <div key={day}>
            <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-gradient-primary shadow-glow" />
            <div className="text-sm font-medium">{day}</div>
            <ul className="mt-2 space-y-2">
              {items.map((m) => (
                <li key={m.id} className="rounded-md border border-border bg-gradient-surface p-3 shadow-elegant">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{m.title}</div>
                    <span className="text-[10px] text-muted-foreground">{m.category}</span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.summary || m.content}</div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
