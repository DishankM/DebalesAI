"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useMe, useLogout } from "@/hooks";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

export default function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { data, isLoading } = useMe();
  const logout = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const user = data?.user;
  const isAdmin = user?.role === "admin";
  const { slug } = params;

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  if (isLoading) return <LoadingScreen />;
  if (!user) return null;

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.push("/login");
  };

  const navItems = [
    {
      label: "Chat",
      href: `/project/${slug}/chat`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    ...(isAdmin
      ? [
          {
            label: "Admin Dashboard",
            href: `/project/${slug}/admin`,
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex flex-col h-full transition-[width] duration-300 ease-out shadow-[4px_0_24px_rgba(0,0,0,0.2)]"
        style={{
          width: sidebarOpen ? 248 : 64,
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 h-16" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <path d="M8 8h6v6H8zM18 8h6v6h-6zM8 18h6v6H8z" fill="white" opacity="0.9"/>
            </svg>
          </div>
          {sidebarOpen && (
            <span className="font-bold text-sm truncate" style={{ fontFamily: "var(--font-display)" }}>
              Debales <span style={{ color: "#6366f1" }}>AI</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarOpen ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
            </svg>
          </button>
        </div>

        {/* Project badge */}
        {sidebarOpen && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-control)]" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.14)" }}>
              <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.55)]" />
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: "#818cf8" }}>{slug}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>Active project</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item flex items-center gap-3 w-full ${active ? "active" : ""}`}
                style={{ color: active ? "#818cf8" : "var(--text-secondary)" }}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="text-sm font-medium truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className={`flex items-center gap-3 ${sidebarOpen ? "" : "justify-center"}`}>
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
              style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>
              {user.name[0]}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{user.name}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{user.role}</p>
              </div>
            )}
            {sidebarOpen && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex-shrink-0 rounded-lg p-1.5 text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                title="Logout"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden min-w-0 bg-[rgba(7,10,18,0.35)]" data-testid="main-content">
        {children}
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen mesh-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="loading-logo w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 8px 28px rgba(99,102,241,0.25)" }}>
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <path d="M8 8h6v6H8zM18 8h6v6h-6zM8 18h6v6H8z" fill="white" opacity="0.9"/>
          </svg>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading workspace...</p>
      </div>
    </div>
  );
}
