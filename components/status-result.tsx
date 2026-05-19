"use client";

import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import type { Result } from "@/lib/result";

interface NotionSuccess {
  pageId: string;
  url: string;
  created: boolean;
}

interface TickTickSuccess {
  taskId: string;
}

interface CreateResult {
  notion: Result<NotionSuccess>;
  ticktick: Result<TickTickSuccess>;
}

interface StatusResultProps {
  result: CreateResult;
  onBack: () => void;
}

function TargetRow({
  label,
  result,
  link,
}: {
  label: string;
  result: Result<unknown>;
  link?: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
        result.ok
          ? "border-emerald-500/20 bg-emerald-500/10"
          : "border-red-500/20 bg-red-500/10"
      }`}
    >
      {result.ok ? (
        <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-400" aria-hidden="true" />
      ) : (
        <XCircle size={18} className="shrink-0 mt-0.5 text-red-400" aria-hidden="true" />
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${result.ok ? "text-emerald-300" : "text-red-300"}`}>
          {label}
          {result.ok && (
            <span className="font-normal text-white/50 ml-1.5">
              {(result.data as NotionSuccess).created === false ? "updated" : "created"}
            </span>
          )}
        </p>
        {!result.ok && (
          <p className="text-xs text-red-400/80 mt-0.5 break-words">{result.error}</p>
        )}
        {result.ok && link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Open in Notion
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
}

export function StatusResult({ result, onBack }: StatusResultProps) {
  const notionUrl =
    result.notion.ok ? (result.notion.data as NotionSuccess).url : undefined;

  const bothOk = result.notion.ok && result.ticktick.ok;
  const bothFailed = !result.notion.ok && !result.ticktick.ok;

  return (
    <div className="space-y-4" role="region" aria-label="Creation results">
      <div>
        <p
          className={`text-sm font-medium mb-3 ${
            bothOk
              ? "text-emerald-400"
              : bothFailed
              ? "text-red-400"
              : "text-amber-400"
          }`}
        >
          {bothOk
            ? "Task created successfully."
            : bothFailed
            ? "Both targets failed. Check your environment variables and try again."
            : "Partial success — one target failed."}
        </p>
        <div className="space-y-2" aria-live="polite">
          <TargetRow label="Notion" result={result.notion} link={notionUrl} />
          <TargetRow label="TickTick" result={result.ticktick} />
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        ← Transform another task
      </button>
    </div>
  );
}
