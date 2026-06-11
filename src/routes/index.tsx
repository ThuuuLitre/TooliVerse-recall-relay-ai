import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brain, Sparkles, ShieldCheck, Clock, Workflow, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TooliVerse — Automating Work. Preserving Knowledge." },
      {
        name: "description",
        content:
          "TooliVerse is an AI workplace memory and productivity hub. Automate emails, summarize meetings, plan tasks, run research, and search your organization's memory.",
      },
      { property: "og:title", content: "TooliVerse — AI Workplace Memory & Productivity Hub" },
      { property: "og:description", content: "Automating work. Preserving knowledge." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [session, setSession] = useState<unknown>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
  }, []);

  if (ready && session) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen">
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-glow">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">TooliVerse</span>
        </div>
        <Link to="/auth">
          <Button variant="ghost">Sign in</Button>
        </Link>
      </header>

      <section className="container mx-auto px-6 pt-12 pb-20 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary-glow" />
          AI Workplace Memory & Productivity Hub
        </div>
        <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          Automating Work. <span className="text-gradient">Preserving Knowledge.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
          TooliVerse helps teams write smarter emails, summarize meetings, plan their week, and instantly recall
          everything the organization already knows — all powered by AI.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90">
              Get started free
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="lg" variant="outline">
              Live demo
            </Button>
          </Link>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Workflow, title: "Smart Email Generator", desc: "Tone, audience and rewrite in one click." },
            { icon: Brain, title: "Workplace Memory", desc: "Store, tag and search organizational knowledge." },
            { icon: Search, title: "Natural Search", desc: "Ask anything; get grounded answers with sources." },
            { icon: Clock, title: "AI Task Planner", desc: "Daily and weekly plans with priority and conflicts." },
            { icon: Sparkles, title: "Research Assistant", desc: "Summarize reports and extract insights instantly." },
            { icon: ShieldCheck, title: "Responsible AI", desc: "Disclaimers, transparency and ethical guidelines." },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-xl border border-border bg-gradient-surface p-5 text-left shadow-elegant transition-transform hover:-translate-y-0.5"
            >
              <Icon className="mb-3 h-6 w-6 text-primary-glow" />
              <div className="font-semibold">{title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TooliVerse · Built for the AI Skills Accelerator Programme
      </footer>
    </div>
  );
}
