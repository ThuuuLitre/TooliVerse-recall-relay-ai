import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateEmail } from "@/lib/ai.functions";
import { createMemory } from "@/lib/memory.functions";
import { PageHeader, PanelCard, Disclaimer } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Markdown } from "@/components/markdown";
import { Mail, Copy, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({ meta: [{ title: "Email Generator — TooliVerse" }] }),
  component: EmailPage,
});

function EmailPage() {
  const gen = useServerFn(generateEmail);
  const save = useServerFn(createMemory);
  const [purpose, setPurpose] = useState("");
  const [audience, setAudience] = useState("Manager");
  const [tone, setTone] = useState("Professional");
  const [context, setContext] = useState("");
  const [draft, setDraft] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!purpose.trim()) return toast.error("Tell me what the email is for.");
    setLoading(true);
    try {
      const r = await gen({ data: { purpose, audience, tone, context, existingDraft: draft } });
      setOutput(r.text);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Smart Email Generator" description="Draft, rewrite and refine emails by audience and tone." icon={Mail} />
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title="Inputs">
          <div className="space-y-3">
            <div>
              <Label>Purpose</Label>
              <Input placeholder="Follow up with client about Q3 deliverables" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Client", "Manager", "Team Member", "Stakeholder"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Formal", "Informal", "Friendly", "Persuasive", "Professional"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Context (optional)</Label>
              <Textarea rows={3} value={context} onChange={(e) => setContext(e.target.value)} placeholder="Background, attachments, prior thread…" />
            </div>
            <div>
              <Label>Existing draft to rewrite (optional)</Label>
              <Textarea rows={5} value={draft} onChange={(e) => setDraft(e.target.value)} />
            </div>
            <Button onClick={run} disabled={loading} className="w-full bg-gradient-primary text-primary-foreground">
              {loading ? "Generating…" : "Generate email"}
            </Button>
          </div>
        </PanelCard>

        <PanelCard title="Output">
          {!output ? (
            <div className="text-sm text-muted-foreground">Your AI-generated email will appear here.</div>
          ) : (
            <div>
              <Markdown content={output} />
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(output); toast.success("Copied"); }}>
                  <Copy className="mr-2 h-3 w-3" />Copy
                </Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  await save({ data: { title: purpose || "Email draft", content: output, category: "Knowledge Base", tags: ["email", tone.toLowerCase()], source_type: "email" } });
                  toast.success("Saved to memory");
                }}>
                  <Save className="mr-2 h-3 w-3" />Save to memory
                </Button>
              </div>
            </div>
          )}
          <Disclaimer>AI may produce inaccurate content. Always review before sending.</Disclaimer>
        </PanelCard>
      </div>
    </div>
  );
}
