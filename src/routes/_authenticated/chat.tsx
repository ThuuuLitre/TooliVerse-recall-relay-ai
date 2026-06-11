import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listThreads, createThread, deleteThread } from "@/lib/chat.functions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "AI Chatbot — TooliVerse" }] }),
  component: ChatLayout,
});

function ChatLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const listFn = useServerFn(listThreads);
  const createFn = useServerFn(createThread);
  const delFn = useServerFn(deleteThread);
  const { data: threads = [] } = useQuery({ queryKey: ["threads"], queryFn: () => listFn({}) });

  const onNew = async () => {
    const t = await createFn({});
    await qc.invalidateQueries({ queryKey: ["threads"] });
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  };

  const onDelete = async (id: string) => {
    await delFn({ data: { id } });
    await qc.invalidateQueries({ queryKey: ["threads"] });
    if (path.endsWith(id)) navigate({ to: "/chat" });
    toast.success("Thread deleted");
  };

  return (
    <div className="grid h-[calc(100vh-7rem)] grid-cols-[260px_1fr] gap-4">
      <div className="flex flex-col rounded-xl border border-border bg-gradient-surface p-3 shadow-elegant">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium"><MessageSquare className="h-4 w-4" />Conversations</div>
          <Button size="sm" variant="ghost" onClick={onNew}><Plus className="h-4 w-4" /></Button>
        </div>
        <ScrollArea className="flex-1">
          <ul className="space-y-1">
            {threads.length === 0 && <li className="px-2 py-4 text-xs text-muted-foreground">No conversations yet. Click + to start.</li>}
            {threads.map((t) => {
              const active = path.includes(t.id);
              return (
                <li key={t.id} className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm ${active ? "bg-accent" : "hover:bg-accent/50"}`}>
                  <Link to="/chat/$threadId" params={{ threadId: t.id }} className="flex-1 truncate">{t.title}</Link>
                  <button onClick={() => onDelete(t.id)} className="opacity-60 hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-gradient-surface shadow-elegant">
        <Outlet />
      </div>
    </div>
  );
}
