import { getSession } from "@/lib/session";
import { CreatePayloadSchema } from "@/lib/schemas";
import { createOrUpdatePage } from "@/lib/integrations/notion";
import { createTickTickTask } from "@/lib/integrations/ticktick";

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

  const parsed = CreatePayloadSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request";
    return Response.json({ error: msg }, { status: 400 });
  }

  const { task, ...payload } = parsed.data;

  const [notionResult, ticktickResult] = await Promise.all([
    createOrUpdatePage(task, parsed.data),
    createTickTickTask(task, parsed.data),
  ]);

  return Response.json({ notion: notionResult, ticktick: ticktickResult });
}
