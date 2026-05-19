"use client";

import { useState, useRef } from "react";
import { Loader2, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import type { NormalizedTask, CreatePayload } from "@/lib/schemas";
import type { Result } from "@/lib/result";
import { StatusResult } from "./status-result";

export type Target = "notion" | "ticktick";

interface NotionSuccess { pageId: string; url: string; created: boolean }
interface TickTickSuccess { taskId: string }

export type PartialCreateResult = {
  notion?: Result<NotionSuccess>;
  ticktick?: Result<TickTickSuccess>;
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysFromToday(days: number): string {
  const [y, m, day] = todayISO().split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, day + days));
  return d.toISOString().split("T")[0];
}

const DATE_CHIPS: Array<{ label: string; fn: () => string | null }> = [
  { label: "Today", fn: () => todayISO() },
  { label: "+1 day", fn: () => addDaysFromToday(1) },
  { label: "+3 days", fn: () => addDaysFromToday(3) },
  { label: "+1 week", fn: () => addDaysFromToday(7) },
  { label: "Clear", fn: () => null },
];

const TARGET_LABEL: Record<Target, string> = {
  notion: "Notion page",
  ticktick: "TickTick task",
};

const DATE_INPUT_CLASS = [
  "w-full rounded-xl border border-white/10 bg-white/5",
  "px-4 py-2.5 text-sm text-white",
  "outline-none transition-all duration-200",
  "focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20",
  "disabled:opacity-50 [color-scheme:dark]",
].join(" ");

interface ReviewCardProps {
  task: NormalizedTask;
  notice: string | null;
}

type Phase = "form" | "creating" | "done";

export function ReviewCard({ task, notice }: ReviewCardProps) {
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState<string | null>(task.dueDate);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [pendingTarget, setPendingTarget] = useState<Target | null>(null);
  const [results, setResults] = useState<PartialCreateResult>({});
  const [detailsOpen, setDetailsOpen] = useState(false);
  const payloadRef = useRef<CreatePayload | null>(null);

  async function runTargets(targets: Target[], payload: CreatePayload) {
    for (const target of targets) {
      setPendingTarget(target);
      let targetResult: Result<NotionSuccess | TickTickSuccess>;
      try {
        const res = await fetch("/api/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, targets: [target] }),
        });
        const data = (await res.json()) as Record<string, Result<NotionSuccess | TickTickSuccess>> & { error?: string };
        if (!res.ok) {
          targetResult = { ok: false, error: data.error ?? "Request failed" };
        } else {
          targetResult = data[target] ?? { ok: false, error: "No result returned" };
        }
      } catch {
        targetResult = { ok: false, error: "Network error" };
      }

      setResults((prev) => ({ ...prev, [target]: targetResult }));

      if (targetResult.ok) {
        const label = TARGET_LABEL[target];
        const isUpdate =
          target === "notion" && !(targetResult.data as NotionSuccess).created;
        toast.success(isUpdate ? `${label} updated` : `${label} created`);
      } else {
        toast.error(
          `${TARGET_LABEL[target]} failed`,
          { description: targetResult.error }
        );
      }
    }
    setPendingTarget(null);
    setPhase("done");
  }

  async function handleConfirm() {
    if (!title.trim() || phase !== "form") return;
    const payload: CreatePayload = {
      task,
      confirmedTitle: title.trim(),
      confirmedDueDate: dueDate,
      startDate,
    };
    payloadRef.current = payload;
    setResults({});
    setPhase("creating");
    await runTargets(["notion", "ticktick"], payload);
  }

  async function handleRetry(target: Target) {
    if (!payloadRef.current || pendingTarget) return;
    setResults((prev) => ({ ...prev, [target]: undefined }));
    setPhase("creating");
    await runTargets([target], payloadRef.current);
  }

  const isCreating = phase === "creating";
  const formDisabled = phase !== "form";

  const submitLabel = pendingTarget
    ? `Creating ${TARGET_LABEL[pendingTarget]}…`
    : "Confirm & Create";

  if (phase === "done") {
    return (
      <StatusResult
        results={results}
        retrying={pendingTarget}
        onRetry={handleRetry}
        onBack={() => {
          sessionStorage.removeItem("conduit_draft");
          sessionStorage.removeItem("conduit_notice");
          window.location.href = "/";
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {notice && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
          {notice}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="review-title" className="block text-sm font-medium text-white/70">
          Title
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={formDisabled}
          className="
            w-full rounded-xl border border-white/10 bg-white/5
            px-4 py-2.5 text-sm text-white placeholder:text-white/30
            outline-none transition-all duration-200
            focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20
            disabled:opacity-50
          "
        />
      </div>

      {/* Due date */}
      <div className="space-y-2">
        <label htmlFor="due-date" className="block text-sm font-medium text-white/70">
          Due Date
        </label>
        <div className="relative">
          <Calendar
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="due-date"
            type="date"
            value={dueDate ?? ""}
            onChange={(e) => setDueDate(e.target.value || null)}
            disabled={formDisabled}
            aria-describedby="due-date-chips"
            className={`pl-9 pr-4 ${DATE_INPUT_CLASS}`}
          />
        </div>
        <div
          id="due-date-chips"
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Quick due date presets"
        >
          {DATE_CHIPS.map(({ label, fn }) => (
            <button
              key={label}
              type="button"
              onClick={() => setDueDate(fn())}
              disabled={formDisabled}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 transition-all hover:bg-indigo-500/20 hover:border-indigo-400/40 hover:text-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Start date */}
      <div className="space-y-1.5">
        <label htmlFor="start-date" className="block text-sm font-medium text-white/70">
          Start Date{" "}
          <span className="font-normal text-white/30">(optional)</span>
        </label>
        <input
          id="start-date"
          type="date"
          value={startDate ?? ""}
          onChange={(e) => setStartDate(e.target.value || null)}
          disabled={formDisabled}
          className={DATE_INPUT_CLASS}
        />
      </div>

      {/* Metadata */}
      {(task.taskType || task.priority || task.status || task.project || task.id) && (
        <div className="flex flex-wrap gap-1.5" role="list" aria-label="Task metadata">
          {task.taskType && <MetaChip label="Type" value={task.taskType} />}
          {task.priority && <MetaChip label="Priority" value={task.priority} />}
          {task.status && <MetaChip label="Status" value={task.status} />}
          {task.project && <MetaChip label="Project" value={task.project} />}
          {task.id && <MetaChip label="ID" value={task.id} />}
        </div>
      )}

      {/* Description */}
      {task.description && (
        <ExpandableSection title="Description" content={task.description} />
      )}

      {/* Addition description */}
      {task.additionDescription && (
        <ExpandableSection title="Addition Description" content={task.additionDescription} />
      )}

      {/* Details */}
      {Object.keys(task.details).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03]">
          <button
            type="button"
            onClick={() => setDetailsOpen((o) => !o)}
            aria-expanded={detailsOpen}
            aria-controls="details-panel"
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <span>Details ({Object.keys(task.details).length} fields)</span>
            {detailsOpen ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
          </button>
          {detailsOpen && (
            <div id="details-panel" className="border-t border-white/10 px-4 py-3 space-y-2">
              {Object.entries(task.details).map(([label, value]) => (
                <div key={label} className="flex gap-3 text-xs">
                  <span className="shrink-0 w-32 sm:w-44 text-white/40 truncate">{label}</span>
                  <span className="text-white/70 break-words min-w-0">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Specific loading state during creation */}
      {isCreating && (
        <div
          role="status"
          aria-live="polite"
          aria-label={submitLabel}
          className="flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-300"
        >
          <Loader2 size={14} className="animate-spin shrink-0" aria-hidden="true" />
          {submitLabel}
        </div>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!title.trim() || isCreating}
        aria-busy={isCreating}
        className="
          relative w-full overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold
          text-white transition-all duration-200
          bg-gradient-to-r from-indigo-600 to-violet-600
          hover:from-indigo-500 hover:to-violet-500
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-[0.98]
        "
      >
        Confirm & Create
      </button>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span
      role="listitem"
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs"
    >
      <span className="text-white/40">{label}</span>
      <span className="text-white/70">{value}</span>
    </span>
  );
}

function ExpandableSection({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);
  const truncated = content.length > 200;

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-white/70">{title}</p>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <p className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">
          {open || !truncated ? content : `${content.slice(0, 200)}…`}
        </p>
        {truncated && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:underline"
          >
            {open ? "Show less" : "Show more"}
          </button>
        )}
      </div>
    </div>
  );
}
