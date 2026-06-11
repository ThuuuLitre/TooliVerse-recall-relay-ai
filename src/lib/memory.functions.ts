import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const MEMORY_CATEGORIES = [
  "Meetings",
  "Projects",
  "Clients",
  "Research",
  "Tasks",
  "Team Updates",
  "Knowledge Base",
  "Personal Notes",
] as const;

const CreateInput = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  summary: z.string().optional(),
  category: z.string().default("Knowledge Base"),
  tags: z.array(z.string()).default([]),
  source_type: z.string().default("note"),
  source_url: z.string().optional(),
});

export const createMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("memories")
      .insert({ user_id: context.userId, ...data })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await context.supabase
      .from("activity_log")
      .insert({ user_id: context.userId, action: "memory_created", entity_id: row.id, metadata: { category: data.category } });
    return row;
  });

export const listMemories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ category: z.string().optional(), limit: z.number().default(100) }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("memories")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.category && data.category !== "All") q = q.eq("category", data.category);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const searchMemories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        query: z.string().default(""),
        category: z.string().optional(),
        useAI: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("memories")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data.category && data.category !== "All") q = q.eq("category", data.category);
    if (data.query.trim()) {
      const term = `%${data.query.trim()}%`;
      q = q.or(`title.ilike.${term},content.ilike.${term},summary.ilike.${term}`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    let aiAnswer: string | null = null;
    if (data.useAI && data.query.trim() && rows && rows.length > 0) {
      const { createGateway, DEFAULT_MODEL } = await import("./ai-gateway.server");
      const { generateText } = await import("ai");
      const gw = createGateway();
      const ctx = rows
        .slice(0, 8)
        .map(
          (r: { title: string; category: string; created_at: string; summary: string | null; content: string }, i: number) =>
            `[${i + 1}] (${r.category}) ${r.title} — ${new Date(r.created_at).toLocaleDateString()}\n${(r.summary || r.content).slice(0, 800)}`,
        )
        .join("\n\n");
      const { text } = await generateText({
        model: gw(DEFAULT_MODEL),
        system: `You answer questions using only the supplied workplace memories. Cite sources as [#]. If the answer isn't present, say so.`,
        prompt: `Question: ${data.query}\n\nMemories:\n${ctx}`,
      });
      aiAnswer = text;
    }
    return { rows: rows ?? [], aiAnswer };
  });

export const deleteMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("memories").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const memoryStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ count: memCount }, { count: actCount }, { data: recent }, { data: byCat }, { data: activity }] = await Promise.all([
      supabase.from("memories").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("activity_log").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("memories").select("id,title,category,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("memories").select("category").eq("user_id", userId),
      supabase.from("activity_log").select("action,created_at,metadata").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    ]);
    const categoryCounts: Record<string, number> = {};
    (byCat ?? []).forEach((r: { category: string }) => {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    });
    const actionCounts: Record<string, number> = {};
    (activity ?? []).forEach((r: { action: string }) => {
      actionCounts[r.action] = (actionCounts[r.action] || 0) + 1;
    });
    return {
      totalMemories: memCount ?? 0,
      totalActions: actCount ?? 0,
      recent: recent ?? [],
      categoryCounts,
      actionCounts,
      activity: activity ?? [],
    };
  });
