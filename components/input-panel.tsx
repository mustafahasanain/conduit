"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardPaste,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import type { NormalizedTask } from "@/lib/schemas";

type InputFormat = "json" | "csv";
type ValidationState = "idle" | "valid" | "invalid";

interface ValidationResult {
  state: ValidationState;
  format: InputFormat | null;
}

function detectFormat(text: string): ValidationResult {
  const trimmed = text.trim();
  if (!trimmed) return { state: "idle", format: null };

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const p = JSON.parse(trimmed);
      if (typeof p === "object" && p !== null) {
        return { state: "valid", format: "json" };
      }
    } catch {
      return { state: "invalid", format: null };
    }
  }

  // CSV: needs at least a header row and one data row with commas
  const lines = trimmed.split("\n").filter((l) => l.trim());
  if (lines.length >= 2 && lines[0].includes(",")) {
    return { state: "valid", format: "csv" };
  }

  return { state: "invalid", format: null };
}

export function InputPanel() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [validation, setValidation] = useState<ValidationResult>({
    state: "idle",
    format: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValidation(detectFormat(content));
    setError("");
  }, [content]);

  async function handlePasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
    } catch {
      setError("Clipboard access denied — paste manually into the box.");
    }
  }

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_048_576) {
      setError("File too large (max 1 MB).");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") setContent(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleSubmit() {
    if (validation.state !== "valid" || !validation.format || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: content, format: validation.format }),
      });

      const data = (await res.json()) as {
        task?: NormalizedTask;
        multipleTasksNotice?: boolean;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Transform failed");
        return;
      }

      if (data.task) {
        sessionStorage.setItem("conduit_draft", JSON.stringify(data.task));
        if (data.multipleTasksNotice) {
          sessionStorage.setItem(
            "conduit_notice",
            "Only the first task was processed."
          );
        } else {
          sessionStorage.removeItem("conduit_notice");
        }
        router.push("/review");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="task-input"
          className="block mb-2 text-sm font-medium text-white/70"
        >
          Task export
        </label>
        <textarea
          id="task-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          rows={10}
          placeholder="Paste your JSON export here, or upload a CSV below…"
          aria-label="Task export content"
          className="
            w-full rounded-xl border border-white/10 bg-white/5
            px-4 py-3 font-mono text-sm text-white placeholder:text-white/25
            outline-none resize-none transition-all duration-200
            focus:border-indigo-400/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-indigo-500/20
            disabled:opacity-50
          "
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handlePasteFromClipboard}
          disabled={loading}
          className="
            flex-1 flex items-center justify-center gap-2
            rounded-xl border border-white/10 bg-white/5
            px-4 py-2.5 text-sm text-white/70
            transition-all duration-200 hover:bg-white/10 hover:text-white
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <ClipboardPaste size={14} />
          Paste from clipboard
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="
            flex-1 flex items-center justify-center gap-2
            rounded-xl border border-white/10 bg-white/5
            px-4 py-2.5 text-sm text-white/70
            transition-all duration-200 hover:bg-white/10 hover:text-white
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <Upload size={14} />
          Upload CSV
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          aria-hidden="true"
          onChange={handleFileUpload}
        />
      </div>

      {validation.state === "valid" && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400"
        >
          <CheckCircle2 size={14} aria-hidden="true" />
          Valid {validation.format === "json" ? "JSON" : "CSV"} task detected
        </div>
      )}

      {validation.state === "invalid" && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-400"
        >
          <AlertCircle size={14} aria-hidden="true" />
          Unrecognized format — paste JSON or upload a CSV
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
        onClick={handleSubmit}
        disabled={validation.state !== "valid" || loading}
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
            Transforming…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Transform
            <ArrowRight size={15} aria-hidden="true" />
          </span>
        )}
      </button>
    </div>
  );
}
