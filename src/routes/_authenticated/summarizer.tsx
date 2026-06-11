import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { summarizeMeeting } from "@/lib/ai.functions";
import { PageHeader, PanelCard, Disclaimer } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Markdown } from "@/components/markdown";
import { FileText, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/summarizer")({
  head: () => ({ meta: [{ title: "Meeting Summarizer — TooliVerse" }] }),
  component: SummPage,
});

function SummPage() {
  const fn = useServerFn(summarizeMeeting);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [save, setSave] = useState(true);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (text.trim().length < 20) return toast.error("Paste meeting notes (20+ chars).");
    setLoading(true);
    try {
      const r = await fn({ data: { text, saveToMemory: save, title: title || "Meeting Summary" } });
      setOutput(r.text);
      if (save) toast.success("Saved to Workplace Memory");
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const t = await f.text();
    setText(t);
    if (!title) setTitle(f.name.replace(/\.\w+$/, ""));
  };

  return (
    <div>
      <PageHeader title="Meeting Notes Summarizer" description="Turn raw transcripts into structured summaries, decisions and action items." icon={FileText} />
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title="Input">
          <div className="space-y-3">
            <div>
              <Label>Meeting title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Q3 Marketing Sync" />
            </div>
            <div>
              <Label>Upload notes file (.txt/.md)</Label>
              <Input type="file" accept=".txt,.md,.csv,.log" onChange={(e) => onFile(e.target.files?.[0])} />
            </div>
            <div>
              <Label>Or paste transcript</Label>
              <Textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={save} onCheckedChange={(c) => setSave(!!c)} /> Save to Workplace Memory
            </label>
            <Button onClick={run} disabled={loading} className="w-full bg-gradient-primary text-primary-foreground">
              {loading ? "Summarizing…" : "Summarize meeting"}
            </Button>
          </div>
        </PanelCard>
        <PanelCard title="Structured summary">
          {output ? (
            <>
              <Markdown content={output} />
              <Button size="sm" variant="outline" className="mt-3" onClick={() => { navigator.clipboard.writeText(output); toast.success("Copied"); }}>
                <Copy className="mr-2 h-3 w-3" />Copy
              </Button>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Summaries, decisions, action items and deadlines will appear here.</div>
          )}
          <Disclaimer>AI summaries may miss nuance. Verify owners and deadlines.</Disclaimer>
        </PanelCard>
      </div>
    </div>
  );
}
