"use client";

import { useState } from "react";
import { Loader2, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import type { NormalizedTask, CreatePayload } from "@/lib/schemas";
import type { Result } from "@/lib/result";
import { StatusResult } from "./status-result";

interface NotionSuccess { pageId: string; url: string; created: boolean }
interface TickTickSuccess { taskId: string }
type CreateResult = {
  notion: Result<NotionSuccess>;
  ticktick: Result<TickTickSuccess>;
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysFromToday(days: number): string {
  const today = todayISO();
  const [y, m, day] = today.split("-").map(Number);
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

const DATE_INPUT_CLASS = `
  w-full rounded-xl border border-white/10 bg-white/5
  px-4 py-2.5 text-sm text-white
  outline-none transition-all duration-200
  focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/20
  disabled:opacity-50 [color-scheme:dark]
`.trim();

interface ReviewCardProps {
  task: NormalizedTask;
  notice: string | null;
}

export function ReviewCard({ task, notice }: ReviewCardProps) {
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState<string | null>(task.dueDate);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CreateResult | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  async function handleConfirm() {
    if (!title.trim() || loading) return;
    setLoading(true);
    setError("");

    const payload: CreatePayload = {
      task,
      confirmedTitle: title.trim(),
      confirmedDueDate: dueDate,
      startDate,
    };

    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as CreateResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Create failed");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <StatusResult
        result={result}
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
          disabled={loading}
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
            disabled={loading}
            className={`pl-9 pr-4 ${DATE_INPUT_CLASS}`}
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick date presets">
          {DATE_CHIPS.map(({ label, fn }) => (
            <button
              key={label}
              type="button"
              onClick={() => setDueDate(fn())}
              disabled={loading}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 transition-all hover:bg-indigo-500/20 hover:border-indigo-400/40 hover:text-white/90 disabled:opacity-50"
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
          disabled={loading}
          className={DATE_INPUT_CLASS}
        />
      </div>

      {/* Metadata chips */}
      <div className="flex flex-wrap gap-1.5" aria-label="Task metadata">
        {task.taskType && <MetaChip label="Type" value={task.taskType} />}
        {task.priority && <MetaChip label="Priority" value={task.priority} />}
        {task.status && <MetaChip label="Status" value={task.status} />}
        {task.project && <MetaChip label="Project" value={task.project} />}
        {task.id && <MetaChip label="ID" value={task.id} />}
      </div>

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
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Details ({Object.keys(task.details).length} fields)
            {detailsOpen ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
          </button>
          {detailsOpen && (
            <div className="border-t border-white/10 px-4 py-3 space-y-2">
              {Object.entries(task.details).map(([label, value]) => (
                <div key={label} className="grid grid-cols-[180px_1fr] gap-2 text-xs">
                  <span className="text-white/40 truncate">{label}</span>
                  <span className="text-white/70 break-words">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!title.trim() || loading}
        aria-busy={loading}
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
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            Creating…
          </span>
        ) : (
          "Confirm & Create"
        )}
      </button>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs">
      <span className="text-white/40">{label}</span>
      <span className="text-white/70">{value}</span>
    </span>
  );
}

function ExpandableSection({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false);
  const truncated = content.length > 200;
  const preview = content.slice(0, 200);

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-white/70">{title}</p>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <p className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">
          {open || !truncated ? content : `${preview}…`}
        </p>
        {truncated && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {open ? "Show less" : "Show more"}
          </button>
        )}
      </div>
    </div>
  );
}
