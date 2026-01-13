// src/pages/child/Today.tsx
// UPDATED: New design implementation - January 2026

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
  faDna,
  faLanguage,
  faPalette,
  faMusic,
  faLaptopCode,
  faRunning,
  faTheaterMasks,
  faCross,
  faBalanceScale,
  faChartLine,
  faArrowRight,
  faCheck,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../contexts/AuthContext";
import { PageLayout } from "../../components/layout";
import { fetchTodayData } from "../../services/todayService";
import type { TodayData, SessionRow } from "../../types/today";

// Map database icon names to FontAwesome icons
const ICON_MAP: Record<string, IconDefinition> = {
  calculator: faCalculator,
  book: faBook,
  flask: faFlask,
  atom: faAtom,
  globe: faGlobe,
  landmark: faLandmark,
  dna: faDna,
  language: faLanguage,
  palette: faPalette,
  music: faMusic,
  "laptop-code": faLaptopCode,
  running: faRunning,
  "theater-masks": faTheaterMasks,
  cross: faCross,
  "balance-scale": faBalanceScale,
  "chart-line": faChartLine,
  // Fallbacks
  history: faLandmark,
  science: faFlask,
  maths: faCalculator,
  english: faBook,
  geography: faGlobe,
  physics: faAtom,
  chemistry: faFlask,
  biology: faDna,
};

function getIconFromName(iconName: string): IconDefinition {
  return ICON_MAP[iconName.toLowerCase()] || faBook;
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

  const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 2) return "In 2 days";
  if (diffDays === 3) return "In 3 days";

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}

/**
 * Get short day name from date
 */
function getShortDayName(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}

/**
 * Check if date is today
 */
function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
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

  // Find next ready session (not_started or started)
  const nextSession = todaySessions.find((s) => s.status === "not_started" || s.status === "started");

  // Current streak
  const currentStreak = gamification?.streak?.current ?? 0;

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
        <div className="max-w-[1120px] mx-auto px-4 py-8">
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
      <main className="max-w-[1120px] mx-auto px-4 py-6">
        
        {/* Greeting Section with Streak */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-primary-900">Hi {childName} 👋</h1>
            {currentStreak > 0 && (
              <div className="flex items-center space-x-2 bg-accent-green/10 px-4 py-2 rounded-full">
                <FontAwesomeIcon icon={faFire} className="text-accent-green" />
                <span className="text-accent-green font-semibold text-sm">{currentStreak}-day streak</span>
              </div>
            )}
          </div>
          <p className="text-neutral-500 text-lg">
            {currentStreak > 0 
              ? "Ready to keep the momentum going?" 
              : "Ready to tackle your revision today?"}
          </p>
        </section>

        {/* Today's Sessions Card */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-primary-900">Today's Sessions</h2>
              <div className="bg-primary-100 px-3 py-1 rounded-full">
                <span className="text-primary-700 font-semibold text-sm">
                  {totalCount} session{totalCount !== 1 ? "s" : ""}
                </span>
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
                <div className="space-y-3 mb-6">
                  {todaySessions.map((session) => (
                    <SessionItem
                      key={session.planned_session_id}
                      session={session}
                      isNext={nextSession?.planned_session_id === session.planned_session_id}
                      onStart={() => handleStartSession(session.planned_session_id)}
                    />
                  ))}
                </div>

                {nextSession && (
                  <button
                    onClick={() => handleStartSession(nextSession.planned_session_id)}
                    className="w-full bg-primary-600 text-white font-semibold py-4 rounded-xl hover:bg-primary-700 transition flex items-center justify-center space-x-2"
                  >
                    <span className="text-lg">Start next session</span>
                    <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        {/* Coming Up Next - Timeline Style */}
        {upcomingDays.length > 0 && (
          <section className="mb-8">
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="text-xl font-bold text-primary-900 mb-4">Coming Up Next</h2>
              
              <div className="space-y-4">
                {upcomingDays.slice(0, 3).map((day, dayIndex) => {
                  const isLast = dayIndex === Math.min(upcomingDays.length - 1, 2);
                  const dayLabel = formatDayLabel(day.date);
                  const shortDay = getShortDayName(day.date);
                  const isFirstDay = dayIndex === 0;

                  return (
                    <div key={day.date} className="flex items-start space-x-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isFirstDay ? "bg-primary-100" : "bg-neutral-100"
                        }`}>
                          <span className={`font-bold text-sm ${
                            isFirstDay ? "text-primary-700" : "text-neutral-600"
                          }`}>{shortDay}</span>
                        </div>
                        {!isLast && (
                          <div className="w-0.5 h-16 bg-neutral-200 my-2" />
                        )}
                      </div>
                      <div className="flex-1 pt-2">
                        <p className="text-neutral-500 text-sm mb-2">{dayLabel}</p>
                        <div className="space-y-2">
                          {day.sessions.slice(0, 2).map((session) => (
                            <div key={session.planned_session_id} className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                isFirstDay ? "bg-primary-600" : "bg-neutral-400"
                              }`} />
                              <span className="text-neutral-700 font-medium">
                                {session.subject_name} - {session.topic_names?.[0] || "Topic TBD"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* This Week's Progress - Grid Style */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-xl font-bold text-primary-900 mb-4">This Week's Progress</h2>
            
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-neutral-600 font-medium">Sessions completed</span>
                <span className="text-primary-900 font-bold text-lg">{completedCount} / {totalCount}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-accent-green h-full rounded-full transition-all duration-500" 
                  style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%" }}
                />
              </div>
            </div>

            {/* Week grid */}
            <WeekProgressGrid 
              completedToday={completedCount} 
              totalToday={totalCount}
              streak={currentStreak}
            />
          </div>
        </section>

        {/* Streak Motivation Section */}
        {currentStreak > 0 && (
          <section className="mb-8">
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl shadow-soft p-6 border border-primary-200">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-accent-green rounded-full flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faFire} className="text-white text-xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-primary-900 mb-2">
                    {currentStreak}-day streak — {currentStreak >= 7 ? "incredible!" : "great momentum!"}
                  </h3>
                  <p className="text-neutral-600 mb-3">
                    {completedCount < totalCount 
                      ? `You're building an amazing habit. Complete today's sessions to reach a ${currentStreak + 1}-day streak!`
                      : `Amazing work! You've completed all your sessions today. Keep it up tomorrow!`
                    }
                  </p>
                  <StreakVisualizer current={currentStreak} showNext={completedCount < totalCount} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Today's Tip Section */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faLightbulb} className="text-primary-600 text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-primary-900 mb-2">Today's Tip</h3>
                <p className="text-neutral-600">
                  Try the Feynman Technique: explain what you've learned in simple terms. 
                  If you struggle, you know where to focus your revision!
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
    </PageLayout>
  );
}

/**
 * Session Item Component - redesigned to match new styling
 */
function SessionItem({
  session,
  isNext,
  onStart,
}: {
  session: SessionRow;
  isNext: boolean;
  onStart: () => void;
}) {
  const isCompleted = session.status === "completed";
  const isStarted = session.status === "started";
  const isNotStarted = session.status === "not_started";
  const isReady = isNext && (isNotStarted || isStarted);

  // Get subject icon from database
  const subjectIcon = getIconFromName(session.icon || "book");
  
  // Get subject color - use for icon background
  const subjectColor = session.color || "#5B2CFF";

  // Topic display
  const topicDisplay = session.topic_names?.[0] || session.topics_preview?.[0]?.topic_name || "Topic TBD";

  // Status badge
  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <div className="bg-accent-green/10 px-3 py-1 rounded-full">
          <span className="text-accent-green text-xs font-medium">Completed</span>
        </div>
      );
    }
    if (isReady) {
      return (
        <div className="bg-accent-green/10 px-3 py-1 rounded-full">
          <span className="text-accent-green text-xs font-medium">Ready</span>
        </div>
      );
    }
    return (
      <div className="bg-neutral-200 px-3 py-1 rounded-full">
        <span className="text-neutral-600 text-xs font-medium">Pending</span>
      </div>
    );
  };

  return (
    <div 
      className="flex items-start space-x-3 p-4 bg-neutral-50 rounded-xl cursor-pointer hover:bg-neutral-100 transition"
      onClick={onStart}
    >
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: subjectColor }}
      >
        <FontAwesomeIcon icon={subjectIcon} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-neutral-700 mb-1">{session.subject_name}</h3>
        <p className="text-neutral-500 text-sm truncate">{topicDisplay}</p>
      </div>
      {getStatusBadge()}
    </div>
  );
}

/**
 * Week Progress Grid - shows 7 days with completion status
 */
function WeekProgressGrid({ 
  completedToday, 
  totalToday,
  streak 
}: { 
  completedToday: number; 
  totalToday: number;
  streak: number;
}) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Get start of week (Monday)
  const startOfWeek = new Date(today);
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(today.getDate() + diff);
  
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Calculate which days are completed based on streak (simplified)
  const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Mon=0 index
  
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day, index) => {
        const isPast = index < todayIndex;
        const isCurrentDay = index === todayIndex;
        const isFuture = index > todayIndex;
        
        // Determine completion status based on streak
        const isCompletedDay = isPast && index >= todayIndex - streak && streak > 0;
        
        return (
          <div key={day} className="flex flex-col items-center">
            <span className={`text-xs mb-2 ${
              isCurrentDay ? "text-primary-700 font-semibold" : "text-neutral-500"
            }`}>
              {isCurrentDay ? "Today" : day}
            </span>
            
            <div className={`w-full h-16 rounded-lg flex items-center justify-center ${
              isCompletedDay 
                ? "bg-accent-green" 
                : isCurrentDay 
                  ? "bg-primary-100 border-2 border-primary-600"
                  : isFuture
                    ? "bg-neutral-100"
                    : "bg-neutral-100"
            }`}>
              {isCompletedDay ? (
                <FontAwesomeIcon icon={faCheck} className="text-white" />
              ) : isCurrentDay ? (
                <span className="text-primary-700 font-bold">{completedToday}/{totalToday}</span>
              ) : isFuture ? (
                <span className="text-neutral-400 font-bold">-</span>
              ) : (
                <span className="text-neutral-400 font-bold">-</span>
              )}
            </div>
            
            <span className={`text-xs mt-1 font-medium ${
              isCompletedDay ? "text-neutral-600" : "text-neutral-400"
            }`}>
              {isCompletedDay ? "✓" : isCurrentDay ? `${completedToday}/${totalToday}` : isFuture ? "" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Streak Visualizer - shows streak progress circles
 */
function StreakVisualizer({ current, showNext }: { current: number; showNext: boolean }) {
  // Show up to 5 circles (4 completed + 1 next if applicable)
  const displayCount = Math.min(current, 4);
  
  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: displayCount }).map((_, i) => (
        <div 
          key={i} 
          className="w-8 h-8 bg-accent-green rounded-full flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faCheck} className="text-white text-xs" />
        </div>
      ))}
      {showNext && (
        <div className="w-8 h-8 bg-primary-300 rounded-full flex items-center justify-center border-2 border-primary-600">
          <span className="text-primary-900 font-bold text-xs">{current + 1}</span>
        </div>
      )}
    </div>
  );
}