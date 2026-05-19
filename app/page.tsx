import { AnimatedBackground } from "@/components/animated-background";
import { InputPanel } from "@/components/input-panel";
import { LogoutButton } from "@/components/logout-button";

export default function Home() {
  return (
    <>
      <AnimatedBackground />
      <main className="min-h-screen flex items-center justify-center p-4">
        <div
          className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl"
          style={{
            boxShadow:
              "0 0 80px 0 rgba(79,70,229,0.15), 0 25px 50px -12px rgba(0,0,0,0.6)",
          }}
        >
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Transform a Task
              </h1>
              <p className="mt-1 text-sm text-white/50">
                Paste a JSON export or upload a CSV to get started.
              </p>
            </div>
            <div className="ml-4 shrink-0">
              <LogoutButton />
            </div>
          </div>

          <InputPanel />
        </div>
      </main>
    </>
  );
}
