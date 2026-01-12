// src/pages/child/Today.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalculator,
  faBook,
  faFlask,
  faAtom,
  faGlobe,
  faLandmark,
  faLightbulb,
  faFire,
  faStar,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../contexts/AuthContext";
import { PageLayout } from "../../components/layout";
import { fetchTodayData } from "../../services/todayService";
import type { TodayData, SessionRow } from "../../types/today";

// Subject icon mapping
const SUBJECT_ICONS: Record<string, any> = {
  maths: faCalculator,
  mathematics: faCalculator,
  english: faBook,
  "english literature": faBook,
  "english language": faBook,
  chemistry: faFlask,
  physics: faAtom,
  biology: faFlask,
  science: faFlask,
  geography: faGlobe,
  history: faLandmark,
};

function getSubjectIcon(subjectName: string) {
  const key = subjectName.toLowerCase();
  return SUBJECT_ICONS[key] || faBook;
}

/**
 * Format date string to friendly label like "Tomorrow", "Wednesday", etc.
 */
function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  if (targetDate.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }
  
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}

export default function Today() {
  const navigate = useNavigate();
  const { user, activeChildId, isParent, profile, loading: authLoading } = useAuth();
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [redirected, setRedirected] = useState(false);

  const childId = useMemo(() => {
    if (activeChildId) return activeChildId;
    const ls = localStorage.getItem("active_child_id");
    return ls || null;
  }, [activeChildId]);

  const childName =
    profile?.preferred_name ||
    profile?.first_name ||
    profile?.full_name?.split(" ")[0] ||
    "there";

  // Handle redirects
  useEffect(() => {
    if (authLoading || redirected) return;
    if (isParent) {
      setRedirected(true);
      navigate("/parent", { replace: true });
    }
  }, [authLoading, isParent, navigate, redirected]);

  // Load data
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      if (authLoading) return;
      if (!childId) {
        setData(null);
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

      const result = await fetchTodayData(childId);

      if (!mounted) return;

      if (result.error) {
        setError(result.error);
        setData(null);
      } else {
        setData(result.data);
        setError("");
      }

      setLoading(false);
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [authLoading, user, childId]);

  const handleStartSession = (plannedSessionId: string) => {
    navigate(`/child/session/${plannedSessionId}`);
  };

  // Extract data for rendering
  const todaySessions = data?.todaySessions ?? [];
  const upcomingDays = data?.upcomingDays ?? [];
  const gamification = data?.gamification ?? null;

  // Calculate progress
  const completedCount = todaySessions.filter((s) => s.status === "completed").length;
  const totalCount = todaySessions.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Find next ready session (not_started or started)
  const nextSession = todaySessions.find((s) => s.status === "not_started" || s.status === "started");

  // Loading state
  if (authLoading || loading) {
    return (
      <PageLayout bgColor="bg-neutral-100">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-neutral-600">Loading your sessions...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PageLayout bgColor="bg-neutral-100">
        <div className="max-w-[1120px] mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-accent-red font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-accent-red text-white rounded-lg hover:opacity-90"
            >
              Try Again
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout bgColor="bg-neutral-100">
      <main className="max-w-[1120px] mx-auto px-6 py-8">
        {/* Greeting Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-900 mb-2">
            Hi {childName}! 👋
          </h1>
          <p className="text-lg text-neutral-600">
            Ready to tackle your revision today?
          </p>
        </div>

        {/* Gamification Bar - only show if has meaningful data */}
        {gamification && (gamification.streak.current > 0 || gamification.points.balance > 0) && (
          <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-2xl shadow-soft">
            {gamification.streak.current > 0 && (
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faFire} className="text-orange-500" />
                <span className="font-semibold text-neutral-700">{gamification.streak.current}</span>
                <span className="text-sm text-neutral-500">day streak</span>
              </div>
            )}
            {gamification.points.balance > 0 && (
              <>
                {gamification.streak.current > 0 && <div className="w-px h-6 bg-neutral-200" />}
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faStar} className="text-accent-amber" />
                  <span className="font-semibold text-neutral-700">{gamification.points.balance}</span>
                  <span className="text-sm text-neutral-500">points</span>
                </div>
              </>
            )}
            {gamification.recentAchievement && (
              <>
                <div className="w-px h-6 bg-neutral-200" />
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faTrophy} className="text-accent-amber" />
                  <span className="text-sm text-neutral-600">{gamification.recentAchievement.name}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Today's Sessions Card */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-neutral-700">Today's sessions</h2>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary-600">{totalCount}</span>
              <span className="text-neutral-500">session{totalCount !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {todaySessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faBook} className="text-2xl text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-primary-900 mb-2">No sessions today</h3>
              <p className="text-neutral-600">Enjoy your break! Check back tomorrow for your next sessions.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {todaySessions.map((session, index) => {
                  const isCompleted = session.status === "completed";
                  const isNext = nextSession?.planned_session_id === session.planned_session_id;
                  const isScheduled = !isCompleted && !isNext;
                  
                  // Container styles - matching design exactly
                  const containerClass = isNext
                    ? "bg-primary-50 border-2 border-primary-200"
                    : "bg-neutral-50";
                  
                  // Icon background - matching design exactly
                  const iconBgClass = isCompleted
                    ? "bg-primary-100"
                    : isNext
                    ? "bg-primary-600"
                    : "bg-neutral-200";
                  
                  // Icon color
                  const iconColorClass = isNext ? "text-white" : isCompleted ? "text-primary-600" : "text-neutral-500";
                  
                  // Topic display
                  const topicDisplay = session.topic_names?.[0] || "Topic TBD";
                  
                  return (
                    <div
                      key={session.planned_session_id}
                      className={`flex items-center justify-between p-4 rounded-xl ${containerClass}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgClass}`}>
                          <FontAwesomeIcon
                            icon={getSubjectIcon(session.subject_name)}
                            className={iconColorClass}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-neutral-700">{session.subject_name}</div>
                          <div className="text-sm text-neutral-500">{topicDisplay}</div>
                          <div className="text-sm text-neutral-400">
                            {isNext ? "Any time today" : `${session.session_duration_minutes} mins`}
                          </div>
                        </div>
                      </div>
                      
                      {/* Status badges - matching design exactly */}
                      {isCompleted && (
                        <span className="px-3 py-1 bg-accent-green text-white text-sm rounded-full">
                          Completed
                        </span>
                      )}
                      {isNext && (
                        <span className="px-3 py-1 bg-primary-600 text-white text-sm rounded-full">
                          {session.status === "started" ? "Continue" : "Ready"}
                        </span>
                      )}
                      {isScheduled && (
                        <span className="px-3 py-1 bg-neutral-300 text-neutral-600 text-sm rounded-full">
                          Scheduled
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {nextSession && (
                <button
                  onClick={() => handleStartSession(nextSession.planned_session_id)}
                  className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
                >
                  Start next session
                </button>
              )}
            </>
          )}
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coming Up */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h3 className="text-lg font-semibold text-neutral-700 mb-4">Coming up</h3>
            {upcomingDays.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">No upcoming sessions scheduled</p>
            ) : (
              <div className="space-y-3">
                {upcomingDays.slice(0, 4).flatMap((day) =>
                  day.sessions.slice(0, 2).map((session) => (
                    <div
                      key={session.planned_session_id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                          <FontAwesomeIcon
                            icon={getSubjectIcon(session.subject_name)}
                            className="text-neutral-500 text-sm"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-neutral-700">
                            {session.subject_name}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {session.topic_names?.[0] || "Topic TBD"}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-neutral-400">{formatDayLabel(day.date)}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* This Week's Progress */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h3 className="text-lg font-semibold text-neutral-700 mb-4">This week's progress</h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#E1E4EE"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#5B2CFF"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-600">{progressPercent}%</span>
                </div>
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="text-sm text-neutral-600">
                {completedCount} of {totalCount} sessions completed
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Sessions completed</span>
                <span className="font-medium text-accent-green">{completedCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Remaining today</span>
                <span className="font-medium text-primary-600">{totalCount - completedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Study Tip Card */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-6 mt-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faLightbulb} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary-900 mb-2">💡 Study Tip</h3>
              <p className="text-neutral-700">
                Try the Pomodoro Technique for your next session! Study for 25 minutes, then take a
                5-minute break. It helps you stay focused and remember more.
              </p>
            </div>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}