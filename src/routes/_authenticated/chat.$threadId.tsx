import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getThreadMessages } from "@/lib/chat.functions";
import { sendChatMessage } from "@/lib/ai.functions";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThread,
});

type Msg = { id: string; role: string; content: string; created_at: string };

function ChatThread() {
  const { threadId } = Route.useParams();
  const qc = useQueryClient();
  const getFn = useServerFn(getThreadMessages);
  const sendFn = useServerFn(sendChatMessage);
  const { data } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => getFn({ data: { threadId } }),
  });
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Msg[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const all = [...(data?.messages ?? []), ...pending];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [all.length]);

  useEffect(() => { inputRef.current?.focus(); }, [threadId, sending]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setInput("");
    setSending(true);
    setPending([{ id: "tmp-u", role: "user", content: msg, created_at: new Date().toISOString() }]);
    try {
      await sendFn({ data: { threadId, message: msg } });
      setPending([]);
      await qc.invalidateQueries({ queryKey: ["thread", threadId] });
      await qc.invalidateQueries({ queryKey: ["threads"] });
    } catch (e) {
      toast.error((e as Error).message);
      setPending([]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3 text-sm font-medium">{data?.thread.title ?? "Conversation"}</div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {all.length === 0 && (
          <div className="grid h-full place-items-center text-center">
            <div>
              <div className="text-sm font-medium">Ask your AI workplace assistant</div>
              <div className="mt-1 text-xs text-muted-foreground">Try: "What was decided about Project Phoenix?" or "Help me plan tomorrow."</div>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {all.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                {m.role === "user" ? <div className="whitespace-pre-wrap text-sm">{m.content}</div> : <Markdown content={m.content} />}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground">Thinking…</div>
            </div>
          )}
        </div>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="border-t border-border p-3"
      >
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message TooliVerse…"
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !input.trim()} className="bg-gradient-primary text-primary-foreground">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
