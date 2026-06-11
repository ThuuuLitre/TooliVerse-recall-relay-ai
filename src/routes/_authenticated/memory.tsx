import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMemories, createMemory, deleteMemory, memoryStats, MEMORY_CATEGORIES } from "@/lib/memory.functions";
import { PageHeader, PanelCard } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Database, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/memory")({
  head: () => ({ meta: [{ title: "Workplace Memory — TooliVerse" }] }),
  component: MemoryPage,
});

function MemoryPage() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  if (path !== "/memory") return <Outlet />;

  return <MemoryCenter />;
}

function MemoryCenter() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMemories);
  const createFn = useServerFn(createMemory);
  const delFn = useServerFn(deleteMemory);
  const statsFn = useServerFn(memoryStats);
  const [category, setCategory] = useState<string>("All");
  const { data: rows = [] } = useQuery({ queryKey: ["memories", category], queryFn: () => listFn({ data: { category, limit: 200 } }) });
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: () => statsFn({}) });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "Knowledge Base", tags: "" });

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) return toast.error("Title and content required.");
    await createFn({ data: { ...form, tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean), source_type: "note" } });
    setForm({ title: "", content: "", category: "Knowledge Base", tags: "" });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["memories"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    toast.success("Memory saved");
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const text = await f.text();
    setForm((s) => ({ ...s, title: s.title || f.name.replace(/\.\w+$/, ""), content: text }));
  };

  const remove = async (id: string) => {
    await delFn({ data: { id } });
    qc.invalidateQueries({ queryKey: ["memories"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };

  return (
    <div>
      <PageHeader title="Workplace Memory Center" description="Store, tag and retrieve organizational knowledge." icon={Database}>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Add memory</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>New memory</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MEMORY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tags (comma separated)</Label>
                  <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Upload (.txt/.md)</Label>
                <Input type="file" accept=".txt,.md,.csv,.log,.json" onChange={(e) => onFile(e.target.files?.[0])} />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>
              <Button onClick={save} className="w-full bg-gradient-primary text-primary-foreground">Save to memory</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <PanelCard title="Total memories"><div className="text-3xl font-semibold">{stats?.totalMemories ?? 0}</div></PanelCard>
        <PanelCard title="Categories"><div className="text-3xl font-semibold">{Object.keys(stats?.categoryCounts ?? {}).length}</div></PanelCard>
        <PanelCard title="Recent uploads"><div className="text-3xl font-semibold">{stats?.recent.length ?? 0}</div></PanelCard>
        <PanelCard title="Total actions"><div className="text-3xl font-semibold">{stats?.totalActions ?? 0}</div></PanelCard>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {["All", ...MEMORY_CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCategory(c)} className={`rounded-full border px-3 py-1 text-xs ${category === c ? "border-primary bg-primary/20 text-primary-foreground" : "border-border bg-card/50 text-muted-foreground hover:bg-accent"}`}>
            {c} {c !== "All" && stats?.categoryCounts[c] ? `(${stats.categoryCounts[c]})` : ""}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rows.length === 0 && <div className="text-sm text-muted-foreground">No memories in this category yet.</div>}
        {rows.map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-gradient-surface p-4 shadow-elegant">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-medium">{m.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</div>
              </div>
              <button onClick={() => remove(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-2 line-clamp-3 text-xs text-muted-foreground">{m.summary || m.content}</div>
            <div className="mt-3 flex flex-wrap gap-1">
              <Badge variant="secondary">{m.category}</Badge>
              {m.tags?.slice(0, 4).map((t: string) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
