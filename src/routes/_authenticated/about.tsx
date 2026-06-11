import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PanelCard } from "@/components/page-shell";
import { Info } from "lucide-react";

export const Route = createFileRoute("/_authenticated/about")({
  head: () => ({ meta: [{ title: "About — TooliVerse" }] }),
  component: () => (
    <div>
      <PageHeader title="About TooliVerse" description="Automating Work. Preserving Knowledge." icon={Info} />
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title="Mission">
          <p className="text-sm text-foreground/90">
            TooliVerse is an AI-powered productivity hub and workplace memory engine. We help employees write better emails,
            run sharper meetings, plan their week, run research and instantly recall what their organization already knows.
          </p>
        </PanelCard>
        <PanelCard title="Who it's for">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Graduates entering the workforce</li>
            <li>Administrative professionals</li>
            <li>Team leaders and project managers</li>
            <li>Business analysts and researchers</li>
            <li>Remote teams and SMBs</li>
          </ul>
        </PanelCard>
        <PanelCard title="Stack">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>React 19 + TanStack Start + TypeScript</li>
            <li>Tailwind CSS v4 design system</li>
            <li>Lovable Cloud (Postgres + Auth + RLS)</li>
            <li>Lovable AI Gateway (Gemini 3 Flash)</li>
          </ul>
        </PanelCard>
        <PanelCard title="Programme">
          <p className="text-sm">
            Built for the AI Skills Accelerator Programme final project — demonstrating real-world prompt engineering,
            responsible AI, and AI-assisted productivity at work.
          </p>
        </PanelCard>
      </div>
    </div>
  ),
});
