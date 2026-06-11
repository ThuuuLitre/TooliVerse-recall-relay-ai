import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { researchSummarize } from "@/lib/ai.functions";
import { PageHeader, PanelCard, Disclaimer } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Markdown } from "@/components/markdown";
import { Microscope } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({ meta: [{ title: "Research Assistant — TooliVerse" }] }),
  component: ResearchPage,
});

function ResearchPage() {
  const fn = useServerFn(researchSummarize);
  const [goal, setGoal] = useState("Executive summary");
  const [text, setText] = useState("");
  const [save, setSave] = useState(true);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (text.trim().length < 20) return toast.error("Paste source text (20+ chars).");
    setLoading(true);
    try {
      const r = await fn({ data: { text, goal, saveToMemory: save } });
      setOutput(r.text);
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="AI Research Assistant" description="Summarize reports and articles, extract insights and recommendations." icon={Microscope} />
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title="Source">
          <div className="space-y-3">
            <div>
              <Label>Goal / question</Label>
              <Input value={goal} onChange={(e) => setGoal(e.target.value)} />
            </div>
            <div>
              <Label>Paste article / report / notes</Label>
              <Textarea rows={14} value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={save} onCheckedChange={(c) => setSave(!!c)} /> Save findings to Workplace Memory
            </label>
            <Button onClick={run} disabled={loading} className="w-full bg-gradient-primary text-primary-foreground">
              {loading ? "Analyzing…" : "Summarize & extract insights"}
            </Button>
          </div>
        </PanelCard>
        <PanelCard title="Findings">
          {output ? <Markdown content={output} /> : <div className="text-sm text-muted-foreground">Executive summary, key insights and recommendations will appear here.</div>}
          <Disclaimer>Always verify AI-generated facts against the original source before sharing.</Disclaimer>
        </PanelCard>
      </div>
    </div>
  );
}
