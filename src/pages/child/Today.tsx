// src/pages/child/Today.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

type SessionRow = {
  planned_session_id: string;
  session_date: string;
  session_index: number;
  session_pattern: string;
  session_duration_minutes: number;
  status: string;
  subject_id: string;
  subject_name: string;
  icon: string | null;
  color: string | null;
  topic_count: number;
  topics_preview: { topic_name: string }[] | null;
};

type UpcomingDay = {
  date: string;
  sessions: SessionRow[];
};

function todayIsoDate() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function tomorrowIsoDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDateLong(isoDate: string) {
  const date = new Date(isoDate + "T12:00:00");
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatDateShort(isoDate: string) {
  const date = new Date(isoDate + "T12:00:00");
  const today = todayIsoDate();
  const tomorrow = tomorrowIsoDate();
  
  if (isoDate === today) return "Today";
  if (isoDate === tomorrow) return "Tomorrow";
  
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

const subjectIcons: Record<string, string> = {
  chemistry: "🧪",
  mathematics: "🔢",
  maths: "🔢",
  "english literature": "📚",
  english: "📚",
  physics: "⚛️",
  biology: "🧬",
  history: "📜",
  geography: "🌍",
  "religious studies": "🕊️",
  "computer science": "💻",
};

const subjectColors: Record<string, string> = {
  chemistry: "bg-emerald-100 text-emerald-700",
  physics: "bg-blue-100 text-blue-700",
  biology: "bg-green-100 text-green-700",
  mathematics: "bg-purple-100 text-purple-700",
  maths: "bg-purple-100 text-purple-700",
  english: "bg-amber-100 text-amber-700",
  "english literature": "bg-amber-100 text-amber-700",
  history: "bg-orange-100 text-orange-700",
  geography: "bg-teal-100 text-teal-700",
  "religious studies": "bg-indigo-100 text-indigo-700",
  "computer science": "bg-slate-100 text-slate-700",
};

function getSubjectIcon(subjectName: string | null) {
  const key = (subjectName || "").toLowerCase();
  return subjectIcons[key] || "📖";
}

function getSubjectColorClass(subjectName: string | null) {
  const key = (subjectName || "").toLowerCase();
  return subjectColors[key] || "bg-gray-100 text-gray-700";
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function getPatternLabel(pattern: string) {
  switch (pattern) {
    case "SINGLE_20": return "Quick session";
    case "DOUBLE_45": return "Standard session";
    case "TRIPLE_70": return "Deep dive";
    default: return "Session";
  }
}

export default function Today() {
  const navigate = useNavigate();
  const { user, activeChildId, isParent, profile, loading: authLoading } = useAuth();

  const [todaySessions, setTodaySessions] = useState<SessionRow[]>([]);
  const [upcomingDays, setUpcomingDays] = useState<UpcomingDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [redirected, setRedirected] = useState(false);

  const childId = useMemo(() => {
    if (activeChildId) return activeChildId;
    const ls = localStorage.getItem("active_child_id");
    return ls || null;
  }, [activeChildId]);

  const childName = profile?.preferred_name || profile?.first_name || profile?.full_name?.split(" ")[0] || "there";

  // Handle redirects
  useEffect(() => {
    if (authLoading || redirected) return;
    if (isParent) {
      setRedirected(true);
      navigate("/parent", { replace: true });
    }
  }, [authLoading, isParent, navigate, redirected]);

  // Load sessions
  useEffect(() => {
    let mounted = true;

    async function loadSessions() {
      if (authLoading) return;
      if (!childId) {
        setTodaySessions([]);
        setUpcomingDays([]);
        if (user) {
          setError("Loading your profile...");
        } else {
          setError("Please log in to see your sessions.");
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const today = todayIsoDate();

      try {
        // Load today's sessions
        const { data: todayData, error: todayError } = await supabase.rpc(
          "rpc_get_todays_sessions",
          { p_child_id: childId, p_session_date: today }
        );

        if (todayError) throw todayError;
        if (!mounted) return;

        setTodaySessions((todayData ?? []) as SessionRow[]);

        // Load upcoming sessions (next 7 days)
        const upcoming: UpcomingDay[] = [];
        for (let i = 1; i <= 7; i++) {
          const date = addDays(today, i);
          const { data: dayData } = await supabase.rpc(
            "rpc_get_todays_sessions",
            { p_child_id: childId, p_session_date: date }
          );
          if (dayData && dayData.length > 0) {
            upcoming.push({ date, sessions: dayData as SessionRow[] });
          }
          if (upcoming.length >= 3) break; // Show max 3 upcoming days
        }

        if (!mounted) return;
        setUpcomingDays(upcoming);
        setLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        console.error("[Today] Load error:", e);
        setError(e?.message ?? "Failed to load sessions");
        setLoading(false);
      }
    }

    loadSessions();
    return () => { mounted = false; };
  }, [authLoading, user, childId]);

  // Calculate stats
  const completedToday = todaySessions.filter(s => s.status === "completed").length;
  const totalToday = todaySessions.length;
  const totalMinutesToday = todaySessions.reduce((sum, s) => sum + (s.session_duration_minutes || 20), 0);

  // Determine which session can be started (first non-completed)
  const nextSessionIndex = todaySessions.findIndex(s => s.status !== "completed");

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Hey {childName} 👋
          </h1>
          <p className="text-gray-600">
            {formatDateLong(todayIsoDate())}
          </p>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : todaySessions.length === 0 ? (
          <NoSessionsState upcomingDays={upcomingDays} />
        ) : (
          <>
            {/* Today's Progress Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Today's Progress</h2>
                <span className="text-sm text-gray-500">
                  {completedToday} of {totalToday} complete
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalToday > 0 ? (completedToday / totalToday) * 100 : 0}%` }}
                />
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About {formatDuration(totalMinutesToday)} total
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {totalToday} session{totalToday !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Today's Sessions */}
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your sessions</h2>
              <div className="space-y-4">
                {todaySessions.map((session, idx) => (
                  <SessionCard
                    key={session.planned_session_id}
                    session={session}
                    sessionNumber={idx + 1}
                    isNext={idx === nextSessionIndex}
                    isLocked={idx > nextSessionIndex && nextSessionIndex >= 0}
                    onStart={() => navigate(`/child/session/${session.planned_session_id}`)}
                  />
                ))}
              </div>
            </div>

            {/* Coming Up */}
            {upcomingDays.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming up</h2>
                <div className="space-y-4">
                  {upcomingDays.map((day) => (
                    <UpcomingDayCard key={day.date} day={day} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600">Loading your sessions...</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-red-700 font-medium mb-1">Something went wrong</p>
      <p className="text-sm text-red-600">{message}</p>
    </div>
  );
}

function NoSessionsState({ upcomingDays }: { upcomingDays: UpcomingDay[] }) {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">You're all done for today!</h3>
        <p className="text-gray-600">
          No sessions scheduled. Enjoy your break! 🎉
        </p>
      </div>

      {upcomingDays.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming up</h2>
          <div className="space-y-4">
            {upcomingDays.map((day) => (
              <UpcomingDayCard key={day.date} day={day} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  sessionNumber,
  isNext,
  isLocked,
  onStart,
}: {
  session: SessionRow;
  sessionNumber: number;
  isNext: boolean;
  isLocked: boolean;
  onStart: () => void;
}) {
  const isCompleted = session.status === "completed";
  const isStarted = session.status === "started";
  const icon = getSubjectIcon(session.subject_name);
  const colorClass = getSubjectColorClass(session.subject_name);

  // Get topics from preview
  const topics = session.topics_preview?.map(t => t.topic_name) || [];

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      isCompleted ? "border-green-200 opacity-75" :
      isLocked ? "border-gray-200 opacity-60" :
      isNext ? "border-indigo-300 ring-2 ring-indigo-100" :
      "border-gray-200"
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${colorClass}`}>
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {session.subject_name || "Subject"}
              </h3>
              <p className="text-sm text-gray-500">
                Session {sessionNumber} • {getPatternLabel(session.session_pattern)}
              </p>
            </div>
          </div>

          <SessionStatus status={session.status} isLocked={isLocked} />
        </div>

        {/* Session info */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDuration(session.session_duration_minutes)}
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {session.topic_count || 1} topic{(session.topic_count || 1) !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Topics preview */}
        {topics.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {topics.slice(0, 3).map((topic, idx) => (
                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {topic}
                </span>
              ))}
              {topics.length > 3 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                  +{topics.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action button */}
        {isCompleted ? (
          <button
            onClick={onStart}
            className="w-full py-3 rounded-xl bg-green-50 text-green-700 font-medium hover:bg-green-100 transition-colors"
          >
            Review session
          </button>
        ) : isLocked ? (
          <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-medium text-center flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Complete previous session first
          </div>
        ) : isStarted ? (
          <button
            onClick={onStart}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Continue session
          </button>
        ) : (
          <button
            onClick={onStart}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Start session
          </button>
        )}
      </div>
    </div>
  );
}

function SessionStatus({ status, isLocked }: { status: string; isLocked: boolean }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Done
      </span>
    );
  }
  
  if (status === "started") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        In progress
      </span>
    );
  }

  if (isLocked) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Locked
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
      Ready
    </span>
  );
}

function UpcomingDayCard({ day }: { day: UpcomingDay }) {
  const totalMinutes = day.sessions.reduce((sum, s) => sum + (s.session_duration_minutes || 20), 0);
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{formatDateShort(day.date)}</h3>
        <span className="text-sm text-gray-500">
          {day.sessions.length} session{day.sessions.length !== 1 ? "s" : ""} • {formatDuration(totalMinutes)}
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {day.sessions.map((session) => (
          <div
            key={session.planned_session_id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${getSubjectColorClass(session.subject_name)}`}
          >
            <span>{getSubjectIcon(session.subject_name)}</span>
            <span className="text-sm font-medium">{session.subject_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}