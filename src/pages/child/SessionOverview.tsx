// src/pages/child/SessionOverview.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function safeRpc<T>(fn: string, args?: Record<string, any>) {
  const first = await supabase.rpc(fn, args ?? {});
  if (!first.error) return first as { data: T; error: null };

  const second = await supabase.rpc(fn);
  if (!second.error) return second as { data: T; error: null };

  return first as any;
}

type TopicInfo = {
  id: string;
  topic_name: string;
};

type PlannedSessionOverview = {
  planned_session_id: string;
  subject_name: string | null;
  topic_ids: string[];
  topics: TopicInfo[];
  session_duration_minutes: number;
};

const subjectIcons: Record<string, string> = {
  chemistry: "🧪",
  mathematics: "🔢",
  "english literature": "📚",
  physics: "⚛️",
  biology: "🧬",
  history: "📜",
  geography: "🌍",
  "religious studies": "🕊️",
};

const topicColors = [
  { bg: "bg-indigo-50", number: "bg-indigo-600", text: "text-indigo-700" },
  { bg: "bg-purple-50", number: "bg-purple-600", text: "text-purple-700" },
  { bg: "bg-blue-50", number: "bg-blue-600", text: "text-blue-700" },
  { bg: "bg-teal-50", number: "bg-teal-600", text: "text-teal-700" },
  { bg: "bg-green-50", number: "bg-green-600", text: "text-green-700" },
];

export default function SessionOverview() {
  const navigate = useNavigate();
  const { plannedSessionId } = useParams<{ plannedSessionId: string }>();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<PlannedSessionOverview | null>(null);
  const [revisionSessionId, setRevisionSessionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const id = String(plannedSessionId ?? "");
      if (!id || !isUuid(id)) {
        setError("That session link looks invalid. Please go back and start again.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1) Pull planned session data
        const { data: planned, error: plannedErr } = await supabase
          .from("planned_sessions")
          .select("id, subject_id, topic_ids, session_duration_minutes")
          .eq("id", id)
          .maybeSingle();

        if (plannedErr) throw plannedErr;
        if (!planned) throw new Error("Session not found.");

        // 2) Get subject name
        let subjectName: string | null = null;
        const subjectRes = await supabase
          .from("subjects")
          .select("subject_name")
          .eq("id", planned.subject_id)
          .maybeSingle();

        if (!subjectRes.error) subjectName = subjectRes.data?.subject_name ?? null;

        // 3) Get all topic details
        const topicIds: string[] = Array.isArray(planned.topic_ids) 
          ? planned.topic_ids.filter((tid: any) => tid && isUuid(String(tid))).map(String)
          : [];

        let topics: TopicInfo[] = [];
        if (topicIds.length > 0) {
          const { data: topicsData, error: topicsErr } = await supabase
            .from("topics")
            .select("id, topic_name")
            .in("id", topicIds);

          if (!topicsErr && topicsData) {
            // Maintain the order from topic_ids
            topics = topicIds
              .map(tid => topicsData.find(t => t.id === tid))
              .filter((t): t is TopicInfo => t !== undefined);
          }
        }

        if (cancelled) return;

        setOverview({
          planned_session_id: id,
          subject_name: subjectName,
          topic_ids: topicIds,
          topics,
          session_duration_minutes: planned.session_duration_minutes ?? 20,
        });

        // 4) Start (or resume) the revision session
        const start = await safeRpc<any>("rpc_start_planned_session", {
          p_planned_session_id: id,
        });

        if (start.error) throw start.error;

        // Support various return shapes
        const rId =
          (start.data as any)?.out_revision_session_id ??
          (Array.isArray(start.data) ? (start.data[0] as any)?.out_revision_session_id : null) ??
          (start.data as any)?.revision_session_id ??
          (start.data as any)?.id ??
          (Array.isArray(start.data) ? (start.data[0] as any)?.id : null);

        const rIdStr = String(rId ?? "");
        if (!isUuid(rIdStr)) {
          throw new Error("Couldn't start the session (no valid revision session id returned).");
        }

        if (cancelled) return;

        setRevisionSessionId(rIdStr);
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        console.error("[SessionOverview] load error:", e);
        setError(e?.message ?? "Failed to load session.");
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [plannedSessionId]);

  const title = useMemo(() => {
    if (!overview) return "Session";
    return overview.subject_name ?? "Session";
  }, [overview]);

  const childName = profile?.preferred_name || profile?.first_name || profile?.full_name || profile?.email?.split("@")[0] || "Student";
  const avatarUrl = profile?.avatar_url;
  const subjectKey = (title || "").toLowerCase();
  const icon = subjectIcons[subjectKey] || "📖";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="text-gray-700">Preparing your session…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900">Session</h1>
          <p className="mt-2 text-gray-600">{error}</p>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate("/child/today")}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
            >
              Back to Today
            </button>
          </div>
        </div>
      </div>
    );
  }

  const topicCount = overview?.topics.length ?? 0;
  const duration = overview?.session_duration_minutes ?? 20;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/child/today")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Revision</h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Help">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              {avatarUrl ? (
                <img src={avatarUrl} alt={childName} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {childName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-gray-900">{childName}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Subject Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-20 h-20 rounded-3xl bg-indigo-100 flex items-center justify-center text-4xl">
              {icon}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
              <p className="text-gray-600 mt-1">Ready to revise</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600 mt-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              About {duration} minutes
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              {topicCount} {topicCount === 1 ? "topic" : "topics"} to cover
            </div>
          </div>
        </div>

        {/* Session Progress */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Session progress</h3>
            <span className="text-sm text-gray-600">Not started</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">0 of 4 steps</span>
            <span className="text-sm font-medium text-indigo-600">Ready to begin</span>
          </div>
        </div>

        {/* What You'll Cover Today - DYNAMIC */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">What you'll cover today</h3>

          {topicCount === 0 ? (
            <p className="text-gray-600">No topics assigned to this session.</p>
          ) : (
            <div className="space-y-4">
              {overview?.topics.map((topic, index) => {
                const colorScheme = topicColors[index % topicColors.length];
                return (
                  <div
                    key={topic.id}
                    className={`flex gap-4 p-6 ${colorScheme.bg} rounded-2xl`}
                  >
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-xl ${colorScheme.number} text-white flex items-center justify-center font-semibold`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {topic.topic_name}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white ${colorScheme.text} text-xs font-medium`}
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Topic {index + 1} of {topicCount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* How This Session Works */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">How this session works</h3>

          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Recall</h4>
                <p className="text-sm text-gray-600">Test what you remember from before</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Reinforce</h4>
                <p className="text-sm text-gray-600">Flashcards and worked examples to strengthen understanding</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Practice</h4>
                <p className="text-sm text-gray-600">Apply what you've learned with questions</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Reflection</h4>
                <p className="text-sm text-gray-600">Review what you've learned and how you feel</p>
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          type="button"
          disabled={!revisionSessionId}
          onClick={() => navigate(`/child/session/${plannedSessionId}/run`)}
          className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg"
        >
          Start session
        </button>
      </div>
    </div>
  );
}