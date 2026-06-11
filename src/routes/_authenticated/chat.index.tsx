import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listThreads, createThread } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const listFn = useServerFn(listThreads);
  const createFn = useServerFn(createThread);
  useEffect(() => {
    (async () => {
      const threads = await listFn({});
      const t = threads[0] ?? (await createFn({}));
      navigate({ to: "/chat/$threadId", params: { threadId: t.id }, replace: true });
    })();
  }, [listFn, createFn, navigate]);
  return <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading chat…</div>;
}
