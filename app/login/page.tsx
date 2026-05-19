"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(searchParams.get("from") ?? "/");
      } else {
        const data = await res.json();
        setError(data.error ?? "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-white/70"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            className="
              w-full rounded-xl border border-white/10 bg-white/5
              px-4 py-3 pr-11 text-sm text-white placeholder:text-white/30
              outline-none transition-all duration-200
              focus:border-indigo-400/60 focus:bg-white/8 focus:ring-2 focus:ring-indigo-500/20
              disabled:opacity-50
            "
            placeholder="Enter your password"
          />
          <button
            type="button"
            aria-label={show ? "Hide password" : "Show password"}
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            tabIndex={-1}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !password}
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
            <Loader2 size={15} className="animate-spin" />
            Signing in…
          </span>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <>
      <AnimatedBackground />
      <main className="min-h-screen flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl"
          style={{ boxShadow: "0 0 80px 0 rgba(79,70,229,0.15), 0 25px 50px -12px rgba(0,0,0,0.6)" }}
        >
          {/* Wordmark */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Conduit
            </h1>
            <p className="mt-1.5 text-sm text-white/50">
              Your personal task pipeline
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </>
  );
}
