"use client";

import { CheckCircle2, XCircle, Clock, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import type { Result } from "@/lib/result";
import type { Target, PartialCreateResult } from "./review-card";

interface NotionSuccess {
  pageId: string;
  url: string;
  created: boolean;
}

interface StatusResultProps {
  results: PartialCreateResult;
  retrying: Target | null;
  onRetry: (target: Target) => void;
  onBack: () => void;
}

const TARGET_LABEL: Record<Target, string> = {
  notion: "Notion",
  ticktick: "TickTick",
};

function TargetRow({
  target,
  result,
  isRetrying,
  onRetry,
}: {
  target: Target;
  result: Result<unknown> | undefined;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  const label = TARGET_LABEL[target];

  if (isRetrying) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3">
        <Loader2 size={18} className="shrink-0 animate-spin text-indigo-400" aria-hidden="true" />
        <p className="text-sm text-indigo-300">Retrying {label}…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <Clock size={18} className="shrink-0 text-white/30" aria-hidden="true" />
        <p className="text-sm text-white/40">Waiting for {label}…</p>
      </div>
    );
  }

  if (result.ok) {
    const notionData = target === "notion" ? (result.data as NotionSuccess) : null;
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
        <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-400" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-emerald-300">
            {label}{" "}
            <span className="font-normal text-white/50">
              {notionData?.created === false ? "updated" : "created"}
            </span>
          </p>
          {notionData?.url && (
            <a
              href={notionData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:underline"
            >
              Open in Notion
              <ExternalLink size={11} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // Failed
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
      <XCircle size={18} className="shrink-0 mt-0.5 text-red-400" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-300">{label} failed</p>
        <p className="text-xs text-red-400/80 mt-0.5 break-words">{result.error}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300 transition-all hover:bg-red-500/20 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        aria-label={`Retry ${label}`}
      >
        <RotateCcw size={11} aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

export function StatusResult({ results, retrying, onRetry, onBack }: StatusResultProps) {
  const targets: Target[] = ["notion", "ticktick"];

  const allDone = targets.every((t) => results[t] !== undefined);
  const allOk = targets.every((t) => results[t]?.ok === true);
  const anyFailed = targets.some((t) => results[t]?.ok === false);

  return (
    <div className="space-y-4" role="region" aria-label="Creation results" aria-live="polite">
      {allDone && (
        <p
          className={`text-sm font-medium ${
            allOk ? "text-emerald-400" : anyFailed ? "text-amber-400" : "text-white/60"
          }`}
        >
          {allOk
            ? "Task created successfully in both targets."
            : "Partial success — retry the failed target below."}
        </p>
      )}

      <div className="space-y-2">
        {targets.map((target) => (
          <TargetRow
            key={target}
            target={target}
            result={results[target]}
            isRetrying={retrying === target}
            onRetry={() => onRetry(target)}
          />
        ))}
      </div>

      {allDone && !retrying && (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:underline"
        >
          ← Transform another task
        </button>
      )}
    </div>
  );
}
