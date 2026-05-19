"use client";

export function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 transition-all hover:bg-white/10 hover:text-white/80"
    >
      Sign out
    </button>
  );
}
