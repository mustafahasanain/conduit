"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "@/components/animated-background";
import { LogoutButton } from "@/components/logout-button";
import { ReviewCard } from "@/components/review-card";
import type { NormalizedTask } from "@/lib/schemas";

export default function ReviewPage() {
  const router = useRouter();
  const [task, setTask] = useState<NormalizedTask | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("conduit_draft");
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      setTask(JSON.parse(raw) as NormalizedTask);
      setNotice(sessionStorage.getItem("conduit_notice"));
      setReady(true);
    } catch {
      router.replace("/");
    }
  }, [router]);

  if (!ready || !task) {
    return (
      <>
        <AnimatedBackground />
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-white/40 text-sm">Loading…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <main className="min-h-screen flex items-center justify-center p-4 py-8">
        <div
          className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-8 shadow-2xl backdrop-blur-2xl"
          style={{
            boxShadow:
              "0 0 80px 0 rgba(79,70,229,0.15), 0 25px 50px -12px rgba(0,0,0,0.6)",
          }}
        >
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-400 mb-1">
                Review & Confirm
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {task.title}
              </h1>
            </div>
            <div className="ml-4 shrink-0">
              <LogoutButton />
            </div>
          </div>

          <ReviewCard task={task} notice={notice} />
        </div>
      </main>
    </>
  );
}
