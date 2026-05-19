"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "@/components/animated-background";
import { LogoutButton } from "@/components/logout-button";
import type { NormalizedTask } from "@/lib/schemas";

export default function ReviewPage() {
  const router = useRouter();
  const [task, setTask] = useState<NormalizedTask | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("conduit_draft");
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      setTask(JSON.parse(raw) as NormalizedTask);
      setNotice(sessionStorage.getItem("conduit_notice"));
    } catch {
      router.replace("/");
    }
  }, [router]);

  if (!task) {
    return (
      <>
        <AnimatedBackground />
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-white/50 text-sm">Loading…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <main className="min-h-screen flex items-center justify-center p-4">
        <div
          className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl"
          style={{
            boxShadow:
              "0 0 80px 0 rgba(79,70,229,0.15), 0 25px 50px -12px rgba(0,0,0,0.6)",
          }}
        >
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-400 mb-1">
                Review
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {task.title}
              </h1>
              {task.id && (
                <p className="mt-1 text-sm text-white/40">{task.id}</p>
              )}
            </div>
            <div className="ml-4 shrink-0">
              <LogoutButton />
            </div>
          </div>

          {notice && (
            <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
              {notice}
            </div>
          )}

          <p className="text-sm text-white/40 italic">
            Review screen coming in Phase 3 — date editing and submission will
            be available here.
          </p>

          <div className="mt-6">
            <button
              onClick={() => router.push("/")}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              ← Back to input
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
