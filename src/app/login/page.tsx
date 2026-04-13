"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "@/hooks";

const DEMO_USERS = [
  { email: "admin@debales.ai", label: "Alex Admin", role: "Admin", project: "debales-demo", color: "indigo" },
  { email: "member@debales.ai", label: "Sam Member", role: "Member", project: "debales-demo", color: "violet" },
  { email: "jordan@techcorp.ai", label: "Jordan Tech", role: "Admin", project: "techcorp", color: "emerald" },
  { email: "casey@techcorp.ai", label: "Casey Dev", role: "Member", project: "techcorp", color: "amber" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const login = useLogin();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login.mutateAsync(email);
      router.push(`/project/${data.user.projectSlug}/chat`);
    } catch (err: unknown) {
      setError((err as Error).message || "Login failed");
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setError("");
    try {
      const data = await login.mutateAsync(userEmail);
      router.push(`/project/${data.user.projectSlug}/chat`);
    } catch (err: unknown) {
      setError((err as Error).message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-6">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }} />

      <div className="w-full max-w-lg relative z-10 fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 12px 40px rgba(99,102,241,0.28), 0 1px 0 rgba(255,255,255,0.12) inset" }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M8 8h6v6H8zM18 8h6v6h-6zM8 18h6v6H8z" fill="white" opacity="0.9"/>
              <path d="M18 18h6v6h-6z" fill="white" opacity="0.4"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>
            Debales <span style={{ color: "#6366f1" }}>AI</span>
          </h1>
          <p className="text-sm tracking-wide" style={{ color: "var(--text-secondary)" }}>
            Multi-tenant AI Assistant Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="card p-8 mb-6 backdrop-blur-sm bg-[rgba(18,24,42,0.72)] border-white/[0.08]">
          <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>
            Sign in to your workspace
          </h2>
          <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
            Use your email or pick a demo account below.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
                required
                data-testid="email-input"
              />
            </div>
            {error && (
              <p className="text-sm px-3 py-2.5 rounded-[var(--radius-control)] border border-rose-500/20" style={{ color: "#fda4af", background: "rgba(244,63,94,0.1)" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={login.isPending}
              className="btn-primary w-full"
              data-testid="login-btn"
            >
              {login.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Signing in...
                </span>
              ) : "Continue with Email"}
            </button>
          </form>
        </div>

        {/* Quick login */}
        <div className="card p-6 backdrop-blur-sm bg-[rgba(18,24,42,0.55)] border-white/[0.06]">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
            Quick Demo Access
          </p>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            One click — no password
          </p>
          <div className="grid grid-cols-2 gap-3">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                onClick={() => handleQuickLogin(u.email)}
                disabled={login.isPending}
                data-testid={`quick-login-${u.role.toLowerCase()}`}
                className="card-hover card text-left p-3.5 cursor-pointer border-0 w-full"
                style={{ background: "rgba(255,255,255,0.025)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: u.color === "indigo" ? "rgba(99,102,241,0.2)" :
                                  u.color === "violet" ? "rgba(139,92,246,0.2)" :
                                  u.color === "emerald" ? "rgba(16,185,129,0.2)" :
                                  "rgba(245,158,11,0.2)",
                      color: u.color === "indigo" ? "#818cf8" :
                             u.color === "violet" ? "#a78bfa" :
                             u.color === "emerald" ? "#34d399" : "#fcd34d",
                    }}>
                    {u.label[0]}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{u.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`badge ${badgeClassForDemo(u.color)}`}>
                    {u.role}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{u.project}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function badgeClassForDemo(color: string) {
  const map: Record<string, string> = {
    indigo: "badge-indigo",
    violet: "badge-violet",
    emerald: "badge-emerald",
    amber: "badge-amber",
  };
  return map[color] || "badge-gray";
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" />
    </svg>
  );
}
