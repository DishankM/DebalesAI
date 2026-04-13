"use client";
import { useState, useRef, useEffect } from "react";
import { useMe, useConversations, useCreateConversation, useMessages, useSendMessage } from "@/hooks";

interface ChatPageProps {
  params: { slug: string };
}

interface Message {
  _id: string;
  role: "user" | "assistant";
  content: string;
  steps?: string[];
  createdAt: string;
}

interface Conversation {
  _id: string;
  title: string;
  updatedAt: string;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { slug } = params;
  const { data: meData } = useMe();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: convsData, isLoading: convsLoading } = useConversations(slug);
  const { data: msgsData } = useMessages(activeConvId);
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();

  const user = meData?.user;
  const conversations: Conversation[] = convsData?.conversations || [];
  const messages: Message[] = msgsData?.messages || localMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (msgsData?.messages) setLocalMessages(msgsData.messages);
  }, [msgsData]);

  const handleNewChat = async () => {
    try {
      const data = await createConversation.mutateAsync({
        title: "New Conversation",
      });
      setActiveConvId(data.conversation._id);
      setLocalMessages([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeConvId || sendMessage.isPending) return;
    const content = input.trim();
    setInput("");

    // Optimistically add user message
    const tempId = `temp-${Date.now()}`;
    const userMsg: Message = { _id: tempId, role: "user", content, steps: [], createdAt: new Date().toISOString() };
    setLocalMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const data = await sendMessage.mutateAsync({ conversationId: activeConvId, content });
      // Append assistant; keep optimistic user row until React Query refetch replaces the list
      setLocalMessages((prev) => [...prev, data.message]);
    } catch {
      setLocalMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Conversations Sidebar */}
      <div className="w-[272px] flex flex-col flex-shrink-0" style={{ borderRight: "1px solid var(--border)", background: "var(--bg-sidebar)" }}>
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            Conversations
          </p>
        </div>
        <div className="px-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <button
            onClick={handleNewChat}
            disabled={createConversation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
            data-testid="new-chat-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 pt-3">
          {convsLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="shimmer h-14 rounded-[10px]" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 mx-2 rounded-[var(--radius-card)] text-center border border-dashed" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.02)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No conversations yet</p>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>Create a new chat to talk to your assistant.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => { setActiveConvId(conv._id); setLocalMessages([]); }}
                className={`sidebar-item w-full text-left ${activeConvId === conv._id ? "active" : ""}`}
                data-testid="conversation-item"
              >
                <div className="flex items-start gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: activeConvId === conv._id ? "#818cf8" : "var(--text-primary)" }}>
                      {conv.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!activeConvId ? (
          <WelcomeScreen onNewChat={handleNewChat} username={user?.name || ""} isAdmin={user?.role === "admin"} />
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 space-y-6" data-testid="messages-area">
              {localMessages.length === 0 && !isTyping && (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center max-w-sm mx-auto">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Start the thread</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>Send a message below — your assistant will reply here.</p>
                </div>
              )}
              {localMessages.map((msg) => (
                <MessageBubble key={msg._id} message={msg} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 sm:p-5 rounded-t-2xl border-t shadow-[0_-12px_40px_rgba(0,0,0,0.2)]" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
              <div className="flex gap-3 items-end max-w-4xl mx-auto">
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                    className="input-field resize-none pr-4"
                    rows={1}
                    style={{ minHeight: 44, maxHeight: 200, lineHeight: "1.5" }}
                    data-testid="chat-input"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sendMessage.isPending}
                  className="btn-primary flex items-center gap-2 flex-shrink-0"
                  style={{ height: 44 }}
                  data-testid="send-btn"
                >
                  {sendMessage.isPending ? (
                    <Spinner />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 max-w-4xl mx-auto fade-in ${isUser ? "flex-row-reverse" : ""}`} data-testid="message-bubble">
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
        style={isUser
          ? { background: "rgba(99,102,241,0.2)", color: "#818cf8" }
          : { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white" }}>
        {isUser ? "U" : "AI"}
      </div>
      <div className={`flex-1 ${isUser ? "flex flex-col items-end" : ""}`}>
        {/* Steps */}
        {!isUser && message.steps && message.steps.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.steps.map((step, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", color: "#818cf8" }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="12" /></svg>
                {step}
              </span>
            ))}
          </div>
        )}
        <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm"
          style={isUser
            ? { background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.22)", color: "var(--text-primary)", borderBottomRightRadius: 6, boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }
            : { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", borderBottomLeftRadius: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
          {message.content}
        </div>
        <p className="text-xs mt-1 px-1" style={{ color: "var(--text-muted)" }}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 max-w-4xl mx-auto fade-in">
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white" }}>
        AI
      </div>
      <div className="px-4 py-3 rounded-2xl shadow-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderBottomLeftRadius: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
        <div className="flex items-center gap-1">
          {[0,1,2].map(i => (
            <div key={i} className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: "#818cf8", animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onNewChat, username, isAdmin }: { onNewChat: () => void; username: string; isAdmin: boolean }) {
  const suggestions = [
    "What products do you offer?",
    "Show me recent orders",
    "What's the pipeline status?",
    "Help me with customer inquiry",
  ];
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.15))", border: "1px solid rgba(99,102,241,0.22)", boxShadow: "0 12px 40px rgba(99,102,241,0.12)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        Hi {username.split(" ")[0]}! 👋
      </h2>
      <p className="text-sm mb-8 max-w-xs" style={{ color: "var(--text-secondary)" }}>
        I'm your AI Assistant. I can help with products, orders, customer data, and more.
        {isAdmin && " Visit the Admin Dashboard to manage integrations."}
      </p>
      <div className="grid grid-cols-2 gap-3 mb-8 w-full max-w-sm">
        {suggestions.map((s) => (
          <button key={s} onClick={onNewChat}
            className="card card-hover text-left p-3 text-xs cursor-pointer"
            style={{ color: "var(--text-secondary)" }}>
            {s}
          </button>
        ))}
      </div>
      <button onClick={onNewChat} className="btn-primary flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Start New Chat
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="15" />
    </svg>
  );
}
