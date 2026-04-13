"use client";
import { useState } from "react";
import { useMe, useDashboard, useUpdateIntegration } from "@/hooks";
import { useRouter } from "next/navigation";
import { IDashboardConfig, IDashboardSection, IDashboardWidget, WidgetType } from "@/types";

// ─── Widget Components ────────────────────────────────────────────────────────

function StatsCard({ widget, stats }: { widget: IDashboardWidget; stats: Record<string, number> }) {
  const config = widget.config as { metric?: string; color?: string } | undefined;
  const metric = config?.metric || "conversations";
  const color = config?.color || "indigo";

  const value = stats[metric] ?? 0;
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    indigo: { bg: "rgba(99,102,241,0.1)", text: "#818cf8", border: "rgba(99,102,241,0.2)" },
    emerald: { bg: "rgba(16,185,129,0.1)", text: "#34d399", border: "rgba(16,185,129,0.2)" },
    violet: { bg: "rgba(139,92,246,0.1)", text: "#a78bfa", border: "rgba(139,92,246,0.2)" },
    rose: { bg: "rgba(244,63,94,0.1)", text: "#fb7185", border: "rgba(244,63,94,0.2)" },
    amber: { bg: "rgba(245,158,11,0.1)", text: "#fcd34d", border: "rgba(245,158,11,0.2)" },
  };
  const c = colorMap[color] || colorMap.indigo;

  const icons: Record<string, React.ReactNode> = {
    conversations: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    users: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    messages: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  };

  return (
    <div className="card p-5 h-full" data-testid={`widget-stats-card-${metric}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {widget.title}
          </p>
          <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            {value.toLocaleString()}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
          {icons[metric] || icons.conversations}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399" }}>
          +12%
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>vs last week</span>
      </div>
    </div>
  );
}

function ConversationChart({ widget, chartData }: { widget: IDashboardWidget; chartData: { date: string; conversations: number; messages: number }[] }) {
  const maxVal = Math.max(...chartData.map((d) => d.messages), 1);
  return (
    <div className="card p-5 h-full" data-testid="widget-conversation-chart">
      <p className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>{widget.title}</p>
      <div className="flex items-end gap-2 h-32">
        {chartData.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col gap-0.5 justify-end" style={{ height: "100px" }}>
              <div className="w-full rounded-t-sm transition-all duration-500"
                style={{ height: `${(d.messages / maxVal) * 80}px`, background: "rgba(99,102,241,0.5)" }} />
              <div className="w-full rounded-t-sm"
                style={{ height: `${(d.conversations / maxVal) * 30}px`, background: "rgba(139,92,246,0.4)" }} />
            </div>
            <span className="text-xs" style={{ color: "var(--text-muted)", fontSize: "10px" }}>{d.date}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(99,102,241,0.5)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Messages</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(139,92,246,0.4)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Conversations</span>
        </div>
      </div>
    </div>
  );
}

function IntegrationStatus({ widget, integrations, onToggle }: {
  widget: IDashboardWidget;
  integrations: { shopify: { enabled: boolean; storeName: string }; crm: { enabled: boolean; provider: string } } | undefined;
  onToggle: (type: "shopify" | "crm", enabled: boolean) => void;
}) {
  const items = [
    {
      key: "shopify" as const,
      name: "Shopify",
      description: integrations?.shopify?.storeName || "Store integration",
      enabled: integrations?.shopify?.enabled ?? false,
      icon: "🛍️",
      color: "emerald",
    },
    {
      key: "crm" as const,
      name: integrations?.crm?.provider || "CRM",
      description: "Customer relationship data",
      enabled: integrations?.crm?.enabled ?? false,
      icon: "👥",
      color: "indigo",
    },
  ];

  return (
    <div className="card p-5 h-full" data-testid="widget-integration-status">
      <p className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>{widget.title}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: item.enabled ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${item.enabled ? "rgba(16,185,129,0.2)" : "var(--border)"}` }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.description}</p>
              </div>
            </div>
            <button
              onClick={() => onToggle(item.key, !item.enabled)}
              className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200"
              style={{ background: item.enabled ? "#10b981" : "rgba(255,255,255,0.1)" }}
              data-testid={`toggle-${item.key}`}
            >
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                style={{ transform: item.enabled ? "translateX(20px)" : "translateX(0)" }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIUsageMeter({ widget }: { widget: IDashboardWidget }) {
  const config = widget.config as { used?: number; limit?: number } | undefined;
  const used = config?.used || 0;
  const limit = config?.limit || 1000;
  const pct = Math.min((used / limit) * 100, 100);
  const color = pct > 80 ? "#f43f5e" : pct > 60 ? "#f59e0b" : "#10b981";

  return (
    <div className="card p-5 h-full" data-testid="widget-ai-usage-meter">
      <p className="text-sm font-semibold mb-3" style={{ fontFamily: "var(--font-display)" }}>{widget.title}</p>
      <div className="flex items-end gap-1 mb-2">
        <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{used}</span>
        <span className="text-sm mb-0.5" style={{ color: "var(--text-muted)" }}>/ {limit}</span>
      </div>
      <div className="w-full h-2 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}50` }} />
      </div>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{pct.toFixed(0)}% of monthly quota used</p>
    </div>
  );
}

function RecentConversations({ widget, conversations }: {
  widget: IDashboardWidget;
  conversations: { id: string; title: string; updatedAt: string }[];
}) {
  return (
    <div className="card p-5 h-full" data-testid="widget-recent-conversations">
      <p className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>{widget.title}</p>
      {conversations.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>No conversations yet</p>
      ) : (
        <div className="space-y-2">
          {conversations.slice(0, 5).map((conv) => (
            <div key={conv.id} className="flex items-center justify-between py-2"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#6366f1" }} />
                <p className="text-sm truncate">{conv.title}</p>
              </div>
              <p className="text-xs flex-shrink-0 ml-3" style={{ color: "var(--text-muted)" }}>
                {new Date(conv.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserActivity({ widget }: { widget: IDashboardWidget }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17];
  return (
    <div className="card p-5 h-full" data-testid="widget-user-activity">
      <p className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>{widget.title}</p>
      <div className="overflow-x-auto">
        <div className="grid gap-1" style={{ gridTemplateColumns: `40px repeat(${days.length}, 1fr)` }}>
          <div />
          {days.map((d) => <div key={d} className="text-center text-xs pb-1" style={{ color: "var(--text-muted)" }}>{d}</div>)}
          {hours.map((h) => (
            <>
              <div key={`h${h}`} className="text-xs flex items-center" style={{ color: "var(--text-muted)" }}>{h}:00</div>
              {days.map((d) => {
                const intensity = Math.random();
                return (
                  <div key={`${d}${h}`} className="h-6 rounded-sm"
                    style={{
                      background: intensity > 0.7 ? "rgba(99,102,241,0.7)" :
                                  intensity > 0.4 ? "rgba(99,102,241,0.3)" :
                                  intensity > 0.1 ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)"
                    }} />
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickActions({ widget, slug }: { widget: IDashboardWidget; slug: string }) {
  const actions = [
    { label: "Open Chat", icon: "💬", href: `/project/${slug}/chat` },
    { label: "View Docs", icon: "📖", href: "#" },
    { label: "API Keys", icon: "🔑", href: "#" },
    { label: "Settings", icon: "⚙️", href: "#" },
  ];
  return (
    <div className="card p-5 h-full" data-testid="widget-quick-actions">
      <p className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>{widget.title}</p>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <a key={a.label} href={a.href}
            className="flex items-center gap-2 p-3 rounded-xl text-sm transition-all"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(99,102,241,0.3)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)"; }}>
            <span>{a.icon}</span>
            <span className="text-xs font-medium">{a.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Widget Renderer (config-driven) ─────────────────────────────────────────
function WidgetRenderer({
  widget,
  stats,
  chartData,
  integrations,
  recentConversations,
  onToggleIntegration,
  slug,
}: {
  widget: IDashboardWidget;
  stats: Record<string, number>;
  chartData: { date: string; conversations: number; messages: number }[];
  integrations: { shopify: { enabled: boolean; storeName: string }; crm: { enabled: boolean; provider: string } } | undefined;
  recentConversations: { id: string; title: string; updatedAt: string }[];
  onToggleIntegration: (type: "shopify" | "crm", enabled: boolean) => void;
  slug: string;
}) {
  if (!widget.visible) return null;

  const sizeClass: Record<string, string> = {
    sm: "col-span-1",
    md: "col-span-1 md:col-span-2",
    lg: "col-span-1 md:col-span-2 lg:col-span-3",
    full: "col-span-full",
  };

  const widgetContent: Partial<Record<WidgetType, React.ReactNode>> = {
    "stats-card": <StatsCard widget={widget} stats={stats} />,
    "conversation-chart": <ConversationChart widget={widget} chartData={chartData} />,
    "integration-status": <IntegrationStatus widget={widget} integrations={integrations} onToggle={onToggleIntegration} />,
    "ai-usage-meter": <AIUsageMeter widget={widget} />,
    "recent-conversations": <RecentConversations widget={widget} conversations={recentConversations} />,
    "user-activity": <UserActivity widget={widget} />,
    "quick-actions": <QuickActions widget={widget} slug={slug} />,
  };

  const content = widgetContent[widget.type as WidgetType];
  if (!content) return null;

  return (
    <div className={sizeClass[widget.size] || "col-span-1"}>
      {content}
    </div>
  );
}

// ─── Section Renderer ─────────────────────────────────────────────────────────
function SectionRenderer({
  section,
  stats,
  chartData,
  integrations,
  recentConversations,
  onToggleIntegration,
  slug,
}: {
  section: IDashboardSection;
  stats: Record<string, number>;
  chartData: { date: string; conversations: number; messages: number }[];
  integrations: { shopify: { enabled: boolean; storeName: string }; crm: { enabled: boolean; provider: string } } | undefined;
  recentConversations: { id: string; title: string; updatedAt: string }[];
  onToggleIntegration: (type: "shopify" | "crm", enabled: boolean) => void;
  slug: string;
}) {
  const sortedWidgets = [...section.widgets].sort((a, b) => a.order - b.order);

  return (
    <div data-testid={`dashboard-section-${section.id}`}>
      <h3 className="text-xs font-semibold uppercase tracking-widest mb-4"
        style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}>
        {section.title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {sortedWidgets.map((widget) => (
          <WidgetRenderer
            key={widget.id}
            widget={widget}
            stats={stats}
            chartData={chartData}
            integrations={integrations}
            recentConversations={recentConversations}
            onToggleIntegration={onToggleIntegration}
            slug={slug}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Admin Dashboard Page ─────────────────────────────────────────────────────
export default function AdminDashboardPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { data: meData } = useMe();
  const { data: dashData, isLoading, error } = useDashboard();
  const updateIntegration = useUpdateIntegration();
  const router = useRouter();

  const user = meData?.user;
  if (user && user.role !== "admin") {
    router.replace(`/project/${slug}/chat`);
    return null;
  }

  const config: IDashboardConfig | null = dashData?.config;
  const stats = dashData?.stats;

  const handleToggleIntegration = async (type: "shopify" | "crm", enabled: boolean) => {
    await updateIntegration.mutateAsync({ [type]: { enabled } });
  };

  const sortedSections = config
    ? [...config.sections].sort((a, b) => a.order - b.order)
    : [];

  if (isLoading) return <DashboardSkeleton />;

  if (error || !config) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Dashboard config not found</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Make sure the database is seeded and you are an admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" data-testid="admin-dashboard">
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: "rgba(8,11,20,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{config.title}</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Config-driven • Layout from MongoDB •{" "}
            <span style={{ color: "#34d399" }}>Live</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-emerald">Admin</span>
          <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
            {slug}
          </span>
        </div>
      </div>

      {/* Config-driven content */}
      <div className="p-6 max-w-7xl mx-auto">
        {sortedSections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            stats={{
              conversations: stats?.totalConversations || 0,
              users: stats?.totalUsers || 0,
              messages: stats?.totalMessages || 0,
            }}
            chartData={stats?.chartData || []}
            integrations={stats?.integrations}
            recentConversations={stats?.recentConversations || []}
            onToggleIntegration={handleToggleIntegration}
            slug={slug}
          />
        ))}

        {/* MongoDB Config Info Box */}
        <div className="card p-5 mt-4" style={{ border: "1px solid rgba(99,102,241,0.2)", background: "rgba(99,102,241,0.04)" }}>
          <div className="flex items-start gap-3">
            <span className="text-xl">🗄️</span>
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: "#818cf8" }}>Config-Driven Dashboard</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                This entire dashboard layout — sections, widget order, widget types, visibility — is read from the{" "}
                <code className="px-1 py-0.5 rounded text-xs" style={{ background: "rgba(99,102,241,0.15)", fontFamily: "var(--font-mono)" }}>
                  dashboardconfigs
                </code>{" "}
                MongoDB collection. Edit that document and refresh to see the dashboard change without any code deployment.
              </p>
              <p className="text-xs mt-2 font-mono" style={{ color: "var(--text-muted)" }}>
                db.dashboardconfigs.findOne({"{"} projectId: ObjectId("...") {"}"})
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="shimmer h-16 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="shimmer h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="shimmer h-48 rounded-xl" />)}
      </div>
      <div className="shimmer h-36 rounded-xl" />
    </div>
  );
}
