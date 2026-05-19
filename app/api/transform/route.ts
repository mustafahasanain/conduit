import { getSession } from "@/lib/session";
import { TransformRequestSchema } from "@/lib/schemas";
import { parseJSON } from "@/lib/parsers/json";
import { parseCSV } from "@/lib/parsers/csv";
import { transformTask } from "@/lib/transform/transform";

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

  const parsed = TransformRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request";
    return Response.json({ error: msg }, { status: 400 });
  }

  const { raw, format } = parsed.data;

  let tasks;
  try {
    tasks = format === "json" ? parseJSON(raw) : parseCSV(raw);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Parse failed" },
      { status: 400 }
    );
  }

  if (tasks.length === 0) {
    return Response.json({ error: "No tasks found in the export" }, { status: 400 });
  }

  let task;
  try {
    task = transformTask(tasks[0]);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Transform failed" },
      { status: 422 }
    );
  }

  return Response.json({
    task,
    multipleTasksNotice: tasks.length > 1,
  });
}
