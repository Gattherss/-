"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Clock3,
  History,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Settings,
  Sparkles,
  User,
  Menu,
  X,
} from "lucide-react";
import type { AIDataSummary } from "@/lib/aiDataLoader";

type ChatRole = "user" | "assistant" | "system";
type ChatMessage = { role: ChatRole; content: string };
type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

const SYSTEM_PROMPT_BASE =
  "你是 GrantBurner 理财助手，专门帮助用户管理项目预算和支出。请用中文简洁、可执行的方式分析财务数据，给出实用建议。必要时展示计算步骤。\n\n";
const MODEL_ID = "deepseek-ai/DeepSeek-V3.2";
const MAX_TOKENS = 87866;
const THINKING_BUDGET = 1333911;
const SESSION_STORAGE_KEY = "deepseek_chat_sessions_v2";

const createSession = (): ChatSession => ({
  id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`,
  title: "新对话",
  messages: [],
  updatedAt: Date.now(),
});

const formatTime = (ts: number) =>
  new Date(ts).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const deriveTitle = (messages: ChatMessage[], fallback: string) => {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (!firstUserMessage) return fallback || "新对话";
  return firstUserMessage.content.slice(0, 18) + (firstUserMessage.content.length > 18 ? "..." : "");
};

export default function CopilotPage() {
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [modelReturned, setModelReturned] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [financialData, setFinancialData] = useState<string>("");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const savedKey = localStorage.getItem("deepseek_api_key");
    setApiKey(savedKey);

    const savedSessions = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSessions) {
      try {
        const parsed: ChatSession[] = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          return;
        }
      } catch {
        // ignore parse errors and fall back to a fresh session
      }
    }

    const starter = createSession();
    setSessions([starter]);
    setCurrentSessionId(starter.id);
  }, []);

  // Load financial data
  useEffect(() => {
    async function loadData() {
      setDataLoading(true);
      try {
        const res = await fetch("/api/ai-data");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.formatted) {
            setFinancialData(json.formatted);
          }
        }
      } catch (err) {
        console.error("Failed to load financial data:", err);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (sessions.length) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    if (!currentSessionId && sessions.length) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [currentSessionId, sessions]);

  const currentSession = useMemo(
    () => sessions.find((s) => s.id === currentSessionId) ?? sessions[0],
    [sessions, currentSessionId]
  );

  const upsertSession = (next: ChatSession) => {
    setSessions((prev) => {
      const others = prev.filter((s) => s.id !== next.id);
      return [next, ...others].sort((a, b) => b.updatedAt - a.updatedAt);
    });
    setCurrentSessionId(next.id);
  };

  const handleCreateSession = () => {
    const fresh = createSession();
    upsertSession(fresh);
    setInput("");
    setError("");
    setModelReturned(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || !apiKey) return;

    const baseSession = currentSession ?? createSession();
    const userMessage: ChatMessage = { role: "user", content };
    const sessionWithUser: ChatSession = {
      ...baseSession,
      title: deriveTitle([...baseSession.messages, userMessage], baseSession.title),
      messages: [...baseSession.messages, userMessage],
      updatedAt: Date.now(),
    };

    upsertSession(sessionWithUser);
    setInput("");
    setPending(true);
    setError("");
    setModelReturned(null);
    setShowHistory(false);

    try {
      // Build system prompt with financial data
      const systemPrompt = SYSTEM_PROMPT_BASE + (financialData || "暂无财务数据。");

      const payloadMessages = [
        { role: "system", content: systemPrompt },
        ...sessionWithUser.messages.slice(-9),
      ];

      const res = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL_ID,
          temperature: 0.3,
          max_tokens: MAX_TOKENS,
          thinking_budget: THINKING_BUDGET,
          messages: payloadMessages,
        }),
      });

      if (!res.ok) {
        throw new Error(`API 调用失败：${res.status}`);
      }

      const json = await res.json();
      const contentReply = json?.choices?.[0]?.message?.content as string | undefined;
      const returnedModel = json?.model as string | undefined;
      setModelReturned(returnedModel ?? MODEL_ID);

      if (!contentReply) {
        throw new Error("AI 未返回内容");
      }

      const assistantMessage: ChatMessage = { role: "assistant", content: contentReply };
      upsertSession({
        ...sessionWithUser,
        messages: [...sessionWithUser.messages, assistantMessage],
        updatedAt: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败，请稍后再试");
    } finally {
      setPending(false);
    }
  };

  const messages = currentSession?.messages ?? [];

  return (
    <main className="min-h-screen px-3 sm:px-4 py-6 sm:py-10 pb-32 max-w-full sm:max-w-5xl mx-auto">
      <header className="mb-4 sm:mb-6 flex items-center justify-between gap-2 sm:gap-3">
        <Link
          href="/"
          className="rounded-full border border-white/10 px-2 sm:px-3 py-1 text-xs text-white/70 hover:text-white hover:border-white/30 transition"
        >
          ← 返回
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="p-2 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition"
            title="设置"
          >
            <Settings size={16} />
          </Link>
          <span className="hidden sm:inline text-xs font-mono uppercase tracking-[0.3em] text-white/60">AI Copilot</span>
        </div>
      </header>

      <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-3 sm:p-5 md:p-6 backdrop-blur-xl shadow-[0_10px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-white/5 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 text-white">
            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-[0_10px_30px_rgba(99,102,241,0.35)]">
              <Sparkles size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-semibold">GrantBurner Copilot</p>
              <p className="text-xs sm:text-sm text-white/60 hidden sm:block">像微信一样聊天，随时返回历史记录继续对话。</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs text-white/60 flex-wrap">
            <span className="rounded-full bg-white/10 px-3 py-1 border border-white/10">
              模型：{modelReturned ?? MODEL_ID}
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1 border border-white/10">
              max_tokens：{MAX_TOKENS}
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1 border border-white/10">
              thinking_budget：{THINKING_BUDGET}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-[260px_1fr] gap-3 sm:gap-4">
          {/* 历史会话 - Mobile: Overlay, Desktop: Sidebar */}
          <aside
            className={`${showHistory ? "fixed inset-0 z-50 bg-black/90 backdrop-blur-md md:relative md:bg-transparent md:backdrop-blur-none" : "hidden"
              } md:block`}
          >
            <div className={`${showHistory ? "absolute top-0 left-0 right-0 bottom-0 p-4 md:p-0" : ""
              } md:rounded-2xl md:border md:border-white/10 md:bg-black/20 md:p-3 md:space-y-3 h-full flex flex-col`}>
              <div className="flex items-center justify-between mb-3 md:mb-0">
                <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                  <History size={16} />
                  历史记录
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateSession}
                    className="flex items-center gap-1 rounded-xl bg-cyan-500/20 text-cyan-200 px-2 py-1 text-xs border border-cyan-500/40 hover:bg-cyan-500/30 transition"
                  >
                    <Plus size={14} /> 新对话
                  </button>
                  {showHistory && (
                    <button
                      onClick={() => setShowHistory(false)}
                      className="md:hidden p-2 rounded-full bg-white/10 text-white"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-2 overflow-auto pr-1">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      setCurrentSessionId(session.id);
                      setShowHistory(false);
                      setError("");
                    }}
                    className={`w-full text-left rounded-xl p-3 border transition group ${session.id === currentSession?.id
                      ? "border-cyan-500/60 bg-cyan-500/10 text-white"
                      : "border-white/5 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-white/60 mb-1">
                      <span className="flex items-center gap-1">
                        <MessageCircle size={14} className="opacity-70" />
                        {session.messages.length} 条
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock3 size={12} className="opacity-60" /> {formatTime(session.updatedAt)}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-white line-clamp-1">
                      {session.title || "新对话"}
                    </div>
                    <div className="text-xs text-white/60 line-clamp-1">
                      {session.messages.slice(-1)[0]?.content || "暂无内容，开始聊天吧"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* 聊天区 */}
          <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 min-h-[480px] sm:min-h-[540px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Bot size={16} className="text-cyan-300" />
                <span className="hidden sm:inline">DeepSeek V3.2 对话</span>
                <span className="sm:hidden">AI 对话</span>
                {modelReturned && (
                  <span className="hidden sm:inline text-[11px] text-cyan-200 bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                    返回模型：{modelReturned}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="md:hidden text-xs text-white/70 border border-white/10 rounded-full px-3 py-1 bg-white/5 flex items-center gap-1"
              >
                <Menu size={14} />
                {showHistory ? "收起" : "历史"}
              </button>
            </div>

            <div className="flex-1 space-y-3 sm:space-y-4 overflow-auto pr-1">
              {dataLoading && (
                <div className="rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/5 p-3 text-center text-cyan-200 text-xs flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  正在加载财务数据...
                </div>
              )}

              {!messages.length ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/10 p-4 text-center text-white/60 text-sm">
                  先问点什么吧，比如"现在的数据是什么情况？"
                </div>
              ) : null}

              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div key={`${msg.role}-${idx}-${msg.content.slice(0, 10)}`} className="flex">
                    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <div className="mr-2 flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white mt-1 shadow-[0_8px_20px_rgba(236,72,153,0.35)]">
                          <Bot size={14} />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-sm leading-relaxed whitespace-pre-wrap border ${isUser
                          ? "bg-emerald-500 text-black border-emerald-400 shadow-[0_8px_18px_rgba(16,185,129,0.25)]"
                          : "bg-white/10 text-white border-white/10"
                          }`}
                      >
                        {msg.content}
                      </div>
                      {isUser && (
                        <div className="ml-2 flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white mt-1 shadow-[0_8px_20px_rgba(6,182,212,0.35)]">
                          <User size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {pending && (
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white mt-1 shadow-[0_8px_20px_rgba(236,72,153,0.35)]">
                    <Bot size={14} />
                  </div>
                  <div className="rounded-2xl px-3 py-2 bg-white/10 border border-white/10 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    DeepSeek 正在思考...
                  </div>
                </div>
              )}
            </div>

            {error ? (
              <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 sm:px-4 py-2 sm:py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {!apiKey && (
              <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 sm:px-4 py-2 sm:py-3 text-sm text-amber-200">
                未检测到 API Key，先去
                <Link href="/settings" className="underline mx-1">
                  设置
                </Link>
                保存吧。
              </div>
            )}

            <form onSubmit={handleSend} className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              <div className="hidden sm:flex text-[11px] text-white/50 items-center gap-2 flex-wrap">
                <span className="rounded-full bg-white/5 border border-white/10 px-2 py-1">
                  请求模型：{MODEL_ID}
                </span>
                <span className="rounded-full bg-white/5 border border-white/10 px-2 py-1">
                  响应模型：{modelReturned ?? "等待返回"}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="像微信一样发消息：例如帮我估一下下周的支出缺口"
                  className="flex-1 rounded-2xl bg-black/30 border border-white/10 px-3 sm:px-4 py-2 sm:py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/70 min-h-[60px] sm:min-h-[80px] resize-none"
                  disabled={pending || !apiKey}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e as any);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={pending || !apiKey || !input.trim()}
                  className="h-[60px] w-16 sm:h-[80px] sm:w-28 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold text-xs sm:text-sm active:scale-[0.98] transition-transform disabled:opacity-60 disabled:pointer-events-none shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-1 sm:gap-2"
                >
                  {pending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  <span className="hidden sm:inline">{pending ? "发送中" : "发送"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
