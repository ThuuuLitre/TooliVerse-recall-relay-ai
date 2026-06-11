import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PanelCard } from "@/components/page-shell";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/responsible-ai")({
  head: () => ({ meta: [{ title: "Responsible AI — TooliVerse" }] }),
  component: () => (
    <div>
      <PageHeader title="Responsible AI" description="How TooliVerse uses AI ethically and transparently." icon={ShieldCheck} />
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title="What to know">
          <ul className="list-disc space-y-2 pl-5 text-sm text-foreground/90">
            <li>AI may generate inaccurate, biased or incomplete information.</li>
            <li>Always verify outputs (names, numbers, deadlines, citations) before acting.</li>
            <li>AI should support — never replace — professional judgment.</li>
            <li>Documents you upload are stored in your private Workplace Memory and used only to answer your questions.</li>
            <li>We do not train external models on your data.</li>
          </ul>
        </PanelCard>
        <PanelCard title="Our principles">
          <ul className="list-disc space-y-2 pl-5 text-sm text-foreground/90">
            <li><strong>Transparency:</strong> every AI-generated answer is labeled and cites memory sources where possible.</li>
            <li><strong>Privacy:</strong> data is scoped to your account via row-level security.</li>
            <li><strong>Human in the loop:</strong> drafts are starting points, not final decisions.</li>
            <li><strong>Accountability:</strong> activity is logged so teams can audit usage.</li>
            <li><strong>Inclusivity:</strong> tone and language options keep communications appropriate.</li>
          </ul>
        </PanelCard>
      </div>
    </div>
  ),
});
