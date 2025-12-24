// src/pages/child/Today.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

type TodaySessionRow = {
  planned_session_id: string;
  child_id: string;

  session_date: string; // YYYY-MM-DD
  session_index: number;
  status: string;

  subject_id: string | null;
  subject_name: string | null;

  topic_ids: string[] | null;
  primary_topic_id: string | null;
  topic_name: string | null;

  component_name: string | null;
  theme_name: string | null;
};

function todayIsoDateLondonSafe() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateLong(isoDate: string) {
  const date = new Date(isoDate + "T12:00:00");
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(date);
}

const subjectIcons: Record<string, string> = {
  chemistry: "🧪",
  mathematics: "🔢",
  "english literature": "📚",
  physics: "⚛️",
  biology: "🧬",
  history: "📜",
  geography: "🌍",
};

export default function Today() {
  const navigate = useNavigate();
  const { user, profile, activeChildId, loading: authLoading, refresh } = useAuth();

  const [rows, setRows] = useState<TodaySessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const refreshAttemptedRef = useRef(false);

  const childId = useMemo(() => {
    if (activeChildId) return activeChildId;
    const ls = localStorage.getItem("active_child_id");
    return ls || null;
  }, [activeChildId]);

  useEffect(() => {
    if (authLoading) return;

    // If a parent lands here, send them to the parent area you actually route to.
    if (user && profile) {
      navigate("/parent", { replace: true });
      return;
    }

    // Logged out => login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // Child session exists but childId not yet hydrated:
    // do ONE non-blocking refresh attempt, then stop.
    if (user && !profile && !activeChildId && !refreshAttemptedRef.current) {
      refreshAttemptedRef.current = true;
      refresh().catch(() => {});
    }
  }, [authLoading, user, profile, activeChildId, refresh, navigate]);

  useEffect(() => {
    let mounted = true;

    async function loadToday() {
      if (!user) return;

      setLoading(true);
      setError("");

      if (!childId) {
        setRows([]);
        setError("No child profile is linked to this account yet.");
        setLoading(false);
        return;
      }

      const p_date = todayIsoDateLondonSafe();

      const { data, error } = await supabase.rpc("rpc_get_todays_planned_sessions", {
        p_child_id: childId,
        p_date,
      });

      if (!mounted) return;

      if (error) {
        setRows([]);
        setError(error.message ?? "Failed to load today's sessions.");
        setLoading(false);
        return;
      }

      setRows((data ?? []) as TodaySessionRow[]);
      setLoading(false);
    }

    loadToday();

    return () => {
      mounted = false;
    };
  }, [user, childId]);

  const childName = profile?.preferred_name || profile?.first_name || profile?.full_name || profile?.email?.split("@")[0] || "Student";
  const avatarUrl = profile?.avatar_url;
  const totalMinutes = rows.length * 20;
  const todayDate = rows.length > 0 ? rows[0].session_date : todayIsoDateLondonSafe();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
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
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Today's revision</h2>
          <p className="text-lg text-gray-600">{formatDateLong(todayDate)}</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-gray-600">Loading…</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-6">
            <p className="text-red-700 font-medium">Couldn't load sessions</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold text-lg mb-2">No sessions scheduled today</p>
            <p className="text-sm text-gray-600">
              Check back tomorrow or contact your parent to update your schedule.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {rows.length} SESSION{rows.length !== 1 ? "S" : ""} PLANNED
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                About {totalMinutes} minutes total
              </div>
            </div>

            <div className="space-y-6">
              {rows.map((session, idx) => (
                <SessionCard
                  key={session.planned_session_id}
                  session={session}
                  sessionNumber={idx + 1}
                  onStart={() => navigate(`/child/session/${session.planned_session_id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SessionCard({
  session,
  sessionNumber,
  onStart,
}: {
  session: TodaySessionRow;
  sessionNumber: number;
  onStart: () => void;
}) {
  const [showAllTopics, setShowAllTopics] = useState(false);

  const subjectKey = (session.subject_name || "").toLowerCase();
  const icon = subjectIcons[subjectKey] || "📖";

  const topics = [session.topic_name, session.component_name, session.theme_name].filter(Boolean);
  const displayTopics = showAllTopics ? topics : topics.slice(0, 2);

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-3xl">
              {icon}
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900">{session.subject_name || "Subject"}</h3>
              <p className="text-sm text-gray-600 mt-1">Session {sessionNumber}</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
            Ready
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            About 20 minutes
          </div>
        </div>

        {topics.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">TOPICS</h4>
              {topics.length > 2 && (
                <button
                  onClick={() => setShowAllTopics(!showAllTopics)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Show {showAllTopics ? "less" : "all"}
                  <svg
                    className={`w-3 h-3 transition-transform ${showAllTopics ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
            <ul className="space-y-2">
              {displayTopics.map((topic, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg"
        >
          Start session
        </button>
      </div>
    </div>
  );
}
