import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { memoryStats } from "@/lib/memory.functions";
import { PageHeader, PanelCard } from "@/components/page-shell";
import { LayoutDashboard, Database, Mail, FileText, CalendarClock, Microscope, MessageSquare, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TooliVerse" }] }),
  component: Dashboard,
});

const ACTION_LABEL: Record<string, string> = {
  email_generated: "Email generated",
  summary_created: "Meeting summary",
  plan_created: "Task plan",
  research_done: "Research session",
  chat_message: "Chat message",
  memory_created: "Memory saved",
};

function Dashboard() {
  const fn = useServerFn(memoryStats);
  const { data, isLoading } = useQuery({ queryKey: ["stats"], queryFn: () => fn({}) });

  const emails = data?.actionCounts["email_generated"] ?? 0;
  const summaries = data?.actionCounts["summary_created"] ?? 0;
  const plans = data?.actionCounts["plan_created"] ?? 0;
  const research = data?.actionCounts["research_done"] ?? 0;
  const chats = data?.actionCounts["chat_message"] ?? 0;
  const memories = data?.totalMemories ?? 0;
  const hoursSaved = Math.round((emails * 0.25 + summaries * 0.75 + plans * 0.5 + research * 1.5 + memories * 0.2) * 10) / 10;

  const tiles = [
    { label: "Emails generated", value: emails, icon: Mail, to: "/email" },
    { label: "Summaries created", value: summaries, icon: FileText, to: "/summarizer" },
    { label: "Plans built", value: plans, icon: CalendarClock, to: "/planner" },
    { label: "Research sessions", value: research, icon: Microscope, to: "/research" },
    { label: "Chat messages", value: chats, icon: MessageSquare, to: "/chat" },
    { label: "Memories stored", value: memories, icon: Database, to: "/memory" },
  ] as const;

  return (
    <div>
      <PageHeader title="Welcome back" description="Your productivity and workplace memory at a glance." icon={LayoutDashboard} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} className="group">
            <div className="rounded-xl border border-border bg-gradient-surface p-4 shadow-elegant transition-transform group-hover:-translate-y-0.5">
              <t.icon className="mb-2 h-5 w-5 text-primary-glow" />
              <div className="text-2xl font-semibold">{isLoading ? "…" : t.value}</div>
              <div className="text-xs text-muted-foreground">{t.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PanelCard title="Recent activity">
            {!data || data.activity.length === 0 ? (
              <div className="text-sm text-muted-foreground">No activity yet — try generating an email or summarizing a meeting.</div>
            ) : (
              <ul className="space-y-2">
                {data.activity.slice(0, 10).map((a, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border border-border bg-card/50 px-3 py-2 text-sm">
                    <span>{ACTION_LABEL[a.action] ?? a.action}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {new Date(a.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>
        </div>
        <div className="space-y-4">
          <PanelCard title="Estimated hours saved">
            <div className="text-4xl font-bold text-gradient">{hoursSaved}h</div>
            <div className="mt-1 text-xs text-muted-foreground">Based on AI-assisted tasks completed.</div>
          </PanelCard>
          <PanelCard title="Recent memories">
            {!data || data.recent.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nothing stored yet.</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.recent.map((m) => (
                  <li key={m.id} className="rounded-md border border-border bg-card/50 px-3 py-2">
                    <div className="truncate font-medium">{m.title}</div>
                    <div className="text-xs text-muted-foreground">{m.category}</div>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>
        </div>
      </div>
    </div>
  );
}
