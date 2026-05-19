import type { CreatePayload, NormalizedTask } from "@/lib/schemas";
import { TICKTICK_PRIORITY_MAP, TICKTICK_PRIORITY_DEFAULT } from "@/lib/mappers";
import type { Result } from "@/lib/result";

const TICKTICK_API = "https://api.ticktick.com/open/v1";

type TickTickSuccess = { taskId: string };

function buildContent(task: NormalizedTask): string {
  const parts: string[] = [];

  if (task.description) parts.push(task.description);
  if (task.additionDescription) {
    if (parts.length > 0) parts.push("");
    parts.push("Addition Description:", task.additionDescription);
  }

  const detailEntries = Object.entries(task.details);
  if (detailEntries.length > 0) {
    if (parts.length > 0) parts.push("");
    parts.push("Details:");
    for (const [label, value] of detailEntries) {
      parts.push(`${label}: ${value}`);
    }
  }

  return parts.join("\n").slice(0, 8000); // TickTick content limit
}

export async function createTickTickTask(
  task: NormalizedTask,
  payload: CreatePayload
): Promise<Result<TickTickSuccess>> {
  const token = process.env.TICKTICK_ACCESS_TOKEN;
  if (!token) return { ok: false, error: "TICKTICK_ACCESS_TOKEN not configured" };

  const body: Record<string, unknown> = {
    title: payload.confirmedTitle,
    content: buildContent(task),
    priority: TICKTICK_PRIORITY_MAP[task.priority ?? ""] ?? TICKTICK_PRIORITY_DEFAULT,
  };

  if (payload.confirmedDueDate) {
    body.dueDate = `${payload.confirmedDueDate}T00:00:00+0000`;
  }

  const projectId = process.env.TICKTICK_PROJECT_ID;
  if (projectId) body.projectId = projectId;

  try {
    const res = await fetch(`${TICKTICK_API}/task`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => String(res.status));
      return { ok: false, error: `TickTick API ${res.status}: ${text}` };
    }

    const data = (await res.json()) as { id?: string };
    return { ok: true, data: { taskId: data.id ?? "unknown" } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `TickTick error: ${msg}` };
  }
}
