import type { CreatePayload, NormalizedTask } from "@/lib/schemas";
import { TICKTICK_PRIORITY_MAP, TICKTICK_PRIORITY_DEFAULT } from "@/lib/mappers";
import type { Result } from "@/lib/result";

const TICKTICK_API = "https://api.ticktick.com/open/v1";

type TickTickSuccess = { taskId: string; url: string | null };

function buildTaskUrl(taskId: string, projectId: string | undefined): string | null {
  if (!taskId || taskId === "unknown") return null;
  if (projectId) return `https://ticktick.com/webapp/#p/${projectId}/tasks/${taskId}`;
  return `https://ticktick.com/webapp/#q/all/tasks/${taskId}`;
}

function todayISODate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toTickTickDate(dateStr: string): string {
  return `${dateStr}T00:00:00+0000`;
}

export async function createTickTickTask(
  task: NormalizedTask,
  payload: CreatePayload,
  notionUrl?: string | null
): Promise<Result<TickTickSuccess>> {
  const token = process.env.TICKTICK_ACCESS_TOKEN;
  if (!token) return { ok: false, error: "TICKTICK_ACCESS_TOKEN not configured" };

  const body: Record<string, unknown> = {
    title: payload.confirmedTitle,
    content: notionUrl ?? "",
    priority: TICKTICK_PRIORITY_MAP[task.priority ?? ""] ?? TICKTICK_PRIORITY_DEFAULT,
  };

  if (payload.confirmedDueDate) {
    // Daily recurring task: first instance on (start date or today), repeats
    // every day, ends on the confirmed due date. Each instance is all-day.
    const firstDate = payload.startDate ?? todayISODate();
    body.isAllDay = true;
    body.startDate = toTickTickDate(firstDate);
    body.dueDate = toTickTickDate(firstDate);
    if (firstDate < payload.confirmedDueDate) {
      const until = payload.confirmedDueDate.replace(/-/g, "");
      body.repeatFlag = `RRULE:FREQ=DAILY;UNTIL=${until}T235959Z`;
    }
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

    const data = (await res.json()) as { id?: string; projectId?: string };
    const taskId = data.id ?? "unknown";
    return {
      ok: true,
      data: { taskId, url: buildTaskUrl(taskId, data.projectId ?? projectId) },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `TickTick error: ${msg}` };
  }
}
