import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const EmailInput = z.object({
  purpose: z.string().min(1),
  audience: z.string().default("Manager"),
  tone: z.string().default("Professional"),
  context: z.string().default(""),
  existingDraft: z.string().default(""),
});

const SummarizeInput = z.object({
  text: z.string().min(20),
  saveToMemory: z.boolean().default(false),
  title: z.string().default("Meeting Summary"),
});

const PlanInput = z.object({
  tasks: z.string().min(1),
  horizon: z.enum(["daily", "weekly"]).default("daily"),
  saveToMemory: z.boolean().default(false),
});

const ResearchInput = z.object({
  text: z.string().min(20),
  goal: z.string().default("Executive summary"),
  saveToMemory: z.boolean().default(false),
});

async function generate(system: string, prompt: string) {
  const { createGateway, DEFAULT_MODEL } = await import("./ai-gateway.server");
  const { generateText } = await import("ai");
  const gw = createGateway();
  const { text } = await generateText({
    model: gw(DEFAULT_MODEL),
    system,
    prompt,
  });
  return text;
}

async function logActivity(
  supabase: { from: (t: string) => { insert: (v: unknown) => Promise<unknown> } },
  userId: string,
  action: string,
  metadata: Record<string, unknown> = {},
) {
  await supabase.from("activity_log").insert({ user_id: userId, action, metadata });
}

async function saveMemory(
  supabase: { from: (t: string) => { insert: (v: unknown) => Promise<unknown> } },
  userId: string,
  payload: {
    title: string;
    content: string;
    summary?: string;
    category: string;
    tags?: string[];
    source_type: string;
  },
) {
  await supabase.from("memories").insert({ user_id: userId, ...payload });
}

export const generateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data, context }) => {
    const system = `You are an expert business writing assistant. Generate clear, professional emails.
Always return:
SUBJECT: <subject line>
BODY:
<email body>

Do not add commentary.`;
    const prompt = data.existingDraft
      ? `Rewrite this email for a ${data.audience} in a ${data.tone} tone. Purpose: ${data.purpose}.\nContext: ${data.context}\n---DRAFT---\n${data.existingDraft}`
      : `Write an email for a ${data.audience} in a ${data.tone} tone. Purpose: ${data.purpose}.\nAdditional context: ${data.context}`;
    const text = await generate(system, prompt);
    await logActivity(context.supabase as never, context.userId, "email_generated", { tone: data.tone });
    return { text };
  });

export const summarizeMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SummarizeInput.parse(d))
  .handler(async ({ data, context }) => {
    const system = `You summarize workplace meeting notes. Output in this exact Markdown format:

## Summary
<3-5 sentences>

## Key Discussion Points
- ...

## Decisions Made
- ...

## Action Items
| Owner | Task | Deadline |
| --- | --- | --- |
| ... | ... | ... |

## Open Questions
- ...`;
    const text = await generate(system, `Meeting transcript / notes:\n${data.text}`);
    if (data.saveToMemory) {
      await saveMemory(context.supabase as never, context.userId, {
        title: data.title,
        content: data.text,
        summary: text,
        category: "Meetings",
        tags: ["meeting", "summary"],
        source_type: "meeting_summary",
      });
    }
    await logActivity(context.supabase as never, context.userId, "summary_created");
    return { text };
  });

export const planTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlanInput.parse(d))
  .handler(async ({ data, context }) => {
    const system = `You are an AI productivity coach. Build a ${"{horizon}"} plan applying the Eisenhower matrix (urgent/important).
Return Markdown with:

## Prioritized Plan
| # | Task | Priority | Est. Time | Notes |

## Suggested Schedule
- 09:00 - ...

## Productivity Tips
- ...

## Potential Conflicts
- ...`;
    const text = await generate(
      system.replace("{horizon}", data.horizon),
      `Build a ${data.horizon} plan from these tasks:\n${data.tasks}`,
    );
    if (data.saveToMemory) {
      await saveMemory(context.supabase as never, context.userId, {
        title: `${data.horizon === "daily" ? "Daily" : "Weekly"} Plan`,
        content: data.tasks,
        summary: text,
        category: "Tasks",
        tags: [data.horizon, "plan"],
        source_type: "task_plan",
      });
    }
    await logActivity(context.supabase as never, context.userId, "plan_created");
    return { text };
  });

export const researchSummarize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ResearchInput.parse(d))
  .handler(async ({ data, context }) => {
    const system = `You are an AI research assistant. Produce a clear, simplified analysis.
Return Markdown with:

## Executive Summary
<5-7 sentences>

## Key Insights
- ...

## Recommendations
- ...

## Simplified Explanation
<plain-language explanation>`;
    const text = await generate(system, `Goal: ${data.goal}\n\nSource document:\n${data.text}`);
    if (data.saveToMemory) {
      await saveMemory(context.supabase as never, context.userId, {
        title: data.goal,
        content: data.text,
        summary: text,
        category: "Research",
        tags: ["research", "summary"],
        source_type: "research",
      });
    }
    await logActivity(context.supabase as never, context.userId, "research_done");
    return { text };
  });

// Chat (non-streaming, persists messages, optionally injects memory context)
const ChatInput = z.object({
  threadId: z.string().uuid(),
  message: z.string().min(1),
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ChatInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify thread belongs to user
    const { data: thread } = await supabase
      .from("chat_threads")
      .select("id, title")
      .eq("id", data.threadId)
      .eq("user_id", userId)
      .single();
    if (!thread) throw new Error("Thread not found");

    // Load recent history
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true })
      .limit(40);

    // Retrieve relevant memories (simple keyword search)
    const keywords = data.message
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 5);
    let memoryContext = "";
    if (keywords.length > 0) {
      const orFilter = keywords.map((k) => `content.ilike.%${k}%,title.ilike.%${k}%,summary.ilike.%${k}%`).join(",");
      const { data: mem } = await supabase
        .from("memories")
        .select("title, category, summary, content, created_at")
        .eq("user_id", userId)
        .or(orFilter)
        .limit(5);
      if (mem && mem.length > 0) {
        memoryContext =
          "\n\nRelevant workplace memories you may reference:\n" +
          (mem as Array<{ title: string; category: string; summary: string | null; content: string; created_at: string }>)
            .map(
              (m, i) =>
                `[${i + 1}] (${m.category}) ${m.title} — ${new Date(m.created_at).toLocaleDateString()}\n${(m.summary || m.content).slice(0, 600)}`,
            )
            .join("\n\n");
      }
    }

    // Insert user message
    await supabase.from("chat_messages").insert({
      thread_id: data.threadId,
      user_id: userId,
      role: "user",
      content: data.message,
    });

    const { createGateway, DEFAULT_MODEL } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");
    const gw = createGateway();

    const messages = [
      {
        role: "system" as const,
        content: `You are TooliVerse, an AI workplace productivity assistant and memory engine. You help employees write, plan, summarize, research and recall workplace knowledge.
- Be concise, structured, and practical.
- Use Markdown (headings, bullets, tables) when helpful.
- When relevant memories are provided, ground your answer in them and cite the [#] reference.
- Add a brief disclaimer when generating subjective recommendations.${memoryContext}`,
      },
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: data.message },
    ];

    const { text } = await generateText({ model: gw(DEFAULT_MODEL), messages });

    // Save assistant reply
    await supabase.from("chat_messages").insert({
      thread_id: data.threadId,
      user_id: userId,
      role: "assistant",
      content: text,
    });

    // Auto-title thread if still default
    if (thread.title === "New conversation") {
      const title = data.message.slice(0, 60).trim() + (data.message.length > 60 ? "…" : "");
      await supabase.from("chat_threads").update({ title }).eq("id", data.threadId);
    } else {
      await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", data.threadId);
    }

    await logActivity(supabase as never, userId, "chat_message");
    return { reply: text };
  });
