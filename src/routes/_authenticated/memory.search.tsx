import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchMemories, MEMORY_CATEGORIES } from "@/lib/memory.functions";
import { PageHeader, PanelCard, Disclaimer } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Markdown } from "@/components/markdown";
import { Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/memory/search")({
  head: () => ({ meta: [{ title: "Memory Search — TooliVerse" }] }),
  component: SearchPage,
});

type Row = { id: string; title: string; category: string; created_at: string; summary: string | null; content: string; tags: string[] };

function SearchPage() {
  const fn = useServerFn(searchMemories);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [useAI, setUseAI] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    try {
      const r = await fn({ data: { query: q, category: cat, useAI } });
      setRows(r.rows as Row[]);
      setAnswer(r.aiAnswer);
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Smart Memory Search" description="Ask questions in natural language across all your stored knowledge." icon={Search} />
      <PanelCard title="Search">
        <div className="grid gap-3 md:grid-cols-[1fr_200px_auto]">
          <div>
            <Label>Question or keywords</Label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder='e.g. "What was decided in the marketing meeting?"' onKeyDown={(e) => e.key === "Enter" && run()} />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["All", ...MEMORY_CATEGORIES].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={run} disabled={loading} className="self-end bg-gradient-primary text-primary-foreground">{loading ? "Searching…" : "Search"}</Button>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <Checkbox checked={useAI} onCheckedChange={(c) => setUseAI(!!c)} /> Generate AI answer with citations
        </label>
      </PanelCard>

      {answer && (
        <div className="mt-4">
          <PanelCard title="AI answer">
            <Markdown content={answer} />
            <Disclaimer>Verify cited sources before acting on AI conclusions.</Disclaimer>
          </PanelCard>
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.map((m, i) => (
          <div key={m.id} className="rounded-xl border border-border bg-gradient-surface p-4 shadow-elegant">
            <div className="flex items-start justify-between">
              <div className="font-medium">[{i + 1}] {m.title}</div>
              <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{m.category}</div>
            <div className="mt-2 line-clamp-4 text-sm">{m.summary || m.content}</div>
          </div>
        ))}
        {!loading && rows.length === 0 && <div className="text-sm text-muted-foreground">No matches — try different keywords.</div>}
      </div>
    </div>
  );
}
