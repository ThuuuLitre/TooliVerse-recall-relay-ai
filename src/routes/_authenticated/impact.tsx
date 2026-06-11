import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { memoryStats } from "@/lib/memory.functions";
import { PageHeader, PanelCard } from "@/components/page-shell";
import { TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/impact")({
  head: () => ({ meta: [{ title: "Productivity Impact — TooliVerse" }] }),
  component: ImpactPage,
});

function ImpactPage() {
  const fn = useServerFn(memoryStats);
  const { data } = useQuery({ queryKey: ["stats"], queryFn: () => fn({}) });
  const emails = data?.actionCounts["email_generated"] ?? 0;
  const summaries = data?.actionCounts["summary_created"] ?? 0;
  const plans = data?.actionCounts["plan_created"] ?? 0;
  const research = data?.actionCounts["research_done"] ?? 0;
  const memories = data?.totalMemories ?? 0;
  const hoursSaved = Math.round((emails * 0.25 + summaries * 0.75 + plans * 0.5 + research * 1.5 + memories * 0.2) * 10) / 10;

  return (
    <div>
      <PageHeader title="Productivity Impact" description="Estimated time savings and business benefits." icon={TrendingUp} />
      <div className="grid gap-4 lg:grid-cols-3">
        <PanelCard title="Estimated hours saved">
          <div className="text-5xl font-bold text-gradient">{hoursSaved}h</div>
          <p className="mt-2 text-xs text-muted-foreground">15min/email · 45min/summary · 30min/plan · 90min/research · 12min/memory</p>
        </PanelCard>
        <PanelCard title="Problem solved">
          <p className="text-sm">Organizations waste up to 20% of their week searching for information and repeating work. TooliVerse cuts that by centralizing knowledge and automating recurring tasks.</p>
        </PanelCard>
        <PanelCard title="Business benefits">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Faster information retrieval</li>
            <li>Reduced knowledge loss when staff change</li>
            <li>Better cross-team collaboration</li>
            <li>Improved productivity & decision-making</li>
            <li>Lower administrative workload</li>
          </ul>
        </PanelCard>
      </div>
    </div>
  );
}
