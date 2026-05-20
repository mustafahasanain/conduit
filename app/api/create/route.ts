import { z } from "zod";
import { getSession } from "@/lib/session";
import { CreatePayloadSchema } from "@/lib/schemas";
import { createOrUpdatePage } from "@/lib/integrations/notion";
import { createTickTickTask } from "@/lib/integrations/ticktick";

const CreateRequestSchema = CreatePayloadSchema.extend({
  // Optional subset of targets; omitting runs all
  targets: z.array(z.enum(["notion", "ticktick"])).min(1).optional(),
  // Used by the client when retrying TickTick alone after Notion already succeeded
  notionUrl: z.string().url().nullable().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.authenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = CreateRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request";
    return Response.json({ error: msg }, { status: 400 });
  }

  const { task, targets: requestedTargets, confirmedTitle, confirmedDueDate, startDate } =
    parsed.data;
  const targets = requestedTargets ?? (["notion", "ticktick"] as const);
  const payload = { task, confirmedTitle, confirmedDueDate, startDate };

  const results: Record<string, unknown> = {};
  let notionUrl: string | null = parsed.data.notionUrl ?? null;

  // Run Notion first so its URL can become the TickTick task's content.
  if (targets.includes("notion")) {
    const r = await createOrUpdatePage(task, payload);
    results.notion = r;
    if (r.ok) notionUrl = r.data.url;
  }

  if (targets.includes("ticktick")) {
    results.ticktick = await createTickTickTask(task, payload, notionUrl);
  }

  return Response.json(results);
}
