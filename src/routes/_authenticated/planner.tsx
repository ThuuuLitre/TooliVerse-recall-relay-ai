import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { planTasks } from "@/lib/ai.functions";
import { PageHeader, PanelCard, Disclaimer } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Markdown } from "@/components/markdown";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ title: "Task Planner — TooliVerse" }] }),
  component: PlanPage,
});

function PlanPage() {
  const fn = useServerFn(planTasks);
  const [tasks, setTasks] = useState("");
  const [horizon, setHorizon] = useState<"daily" | "weekly">("daily");
  const [save, setSave] = useState(true);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!tasks.trim()) return toast.error("List the tasks first.");
    setLoading(true);
    try {
      const r = await fn({ data: { tasks, horizon, saveToMemory: save } });
      setOutput(r.text);
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="AI Task Planner & Scheduler" description="Build a prioritized plan with time estimates and conflict warnings." icon={CalendarClock} />
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title="Your tasks">
          <Tabs value={horizon} onValueChange={(v) => setHorizon(v as "daily" | "weekly")} className="mb-3">
            <TabsList>
              <TabsTrigger value="daily">Daily plan</TabsTrigger>
              <TabsTrigger value="weekly">Weekly plan</TabsTrigger>
            </TabsList>
          </Tabs>
          <Label>List tasks (one per line)</Label>
          <Textarea rows={12} value={tasks} onChange={(e) => setTasks(e.target.value)} placeholder={`Finish client report\nReview pull requests\nPrepare slides for Friday\nCall vendor about renewal`} />
          <label className="mt-3 flex items-center gap-2 text-sm">
            <Checkbox checked={save} onCheckedChange={(c) => setSave(!!c)} /> Save plan to Workplace Memory
          </label>
          <Button onClick={run} disabled={loading} className="mt-3 w-full bg-gradient-primary text-primary-foreground">
            {loading ? "Planning…" : `Build ${horizon} plan`}
          </Button>
        </PanelCard>
        <PanelCard title="Your plan">
          {output ? <Markdown content={output} /> : <div className="text-sm text-muted-foreground">Your prioritized schedule will appear here.</div>}
          <Disclaimer>AI suggestions don't replace your judgment — adjust priorities to match real constraints.</Disclaimer>
        </PanelCard>
      </div>
    </div>
  );
}
