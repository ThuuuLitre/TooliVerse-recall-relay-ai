import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PanelCard } from "@/components/page-shell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/prompts")({
  head: () => ({ meta: [{ title: "Prompt Strategy — TooliVerse" }] }),
  component: PromptsPage,
});

const items = [
  {
    title: "Email Generator — System Prompt",
    body: `You are an expert business writing assistant. Generate clear, professional emails.\nAlways return:\nSUBJECT: <subject line>\nBODY:\n<email body>\nDo not add commentary.`,
    note: "Forces a deterministic SUBJECT/BODY format so we can parse output reliably.",
  },
  {
    title: "Meeting Summarizer — Structured Output",
    body: `Output in this exact Markdown format:\n## Summary\n## Key Discussion Points\n## Decisions Made\n## Action Items (table: Owner | Task | Deadline)\n## Open Questions`,
    note: "Tables + headings make summaries scannable and easy to store as memories.",
  },
  {
    title: "Task Planner — Eisenhower Matrix",
    body: `Build a {daily|weekly} plan applying urgency/importance. Return prioritized table, suggested schedule, productivity tips, potential conflicts.`,
    note: "Reusable horizon variable lets one prompt handle daily and weekly plans.",
  },
  {
    title: "Research Assistant — Insight Extraction",
    body: `Return: Executive Summary, Key Insights, Recommendations, Simplified Explanation.`,
    note: "Forces both expert and plain-language outputs in one call.",
  },
  {
    title: "Workplace Memory Retrieval — Grounded Answering",
    body: `Answer using ONLY the supplied memories. Cite [#]. If unknown, say so.`,
    note: "Prevents hallucination; cites memory sources by index for transparency.",
  },
];

const beforeAfter = {
  before: `"Write me an email for my boss about being late."`,
  after: `"Write a professional, concise email to my Manager apologising for being 20 minutes late tomorrow morning due to a doctor's appointment. Mention I will make up the time."`,
};

function PromptsPage() {
  return (
    <div>
      <PageHeader title="Prompt Strategy" description="The prompt engineering behind TooliVerse." icon={Sparkles} />
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title="Prompt templates">
          <Accordion type="multiple" className="w-full">
            {items.map((p, i) => (
              <AccordionItem key={i} value={`p-${i}`}>
                <AccordionTrigger>{p.title}</AccordionTrigger>
                <AccordionContent>
                  <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs">{p.body}</pre>
                  <div className="mt-2 text-xs text-muted-foreground">Why: {p.note}</div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </PanelCard>
        <PanelCard title="Refinement — before & after">
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs font-medium text-muted-foreground">Before</div>
              <pre className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs">{beforeAfter.before}</pre>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">After</div>
              <pre className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs">{beforeAfter.after}</pre>
            </div>
            <div className="text-xs text-muted-foreground">
              Better prompts specify audience, tone, intent, constraints and desired format. TooliVerse encodes this structure into each tool so users don't have to.
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
