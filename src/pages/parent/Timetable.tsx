// src/pages/parent/Timetable.tsx

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faPlus,
  faLightbulb,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchChildrenForParent,
  fetchTimetableSessions,
  extractSubjectLegend,
  getDateRange,
  getDayIndex,
  type TimetableSession,
  type ChildOption,
  type SubjectLegend,
} from "../../services/timetableService";

// Design system colors
const COLORS = {
  primary: { 50: "#F7F4FF", 100: "#EAE3FF", 200: "#D4C7FF", 600: "#5B2CFF", 700: "#4520C5", 900: "#2A185E" },
  neutral: { 50: "#F9FAFC", 100: "#F6F7FB", 200: "#E1E4EE", 500: "#6C7280", 600: "#4B5161", 700: "#1F2330" },
  accent: { green: "#1EC592", amber: "#FFB547", red: "#F05151" },
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = [
  { id: "morning", label: "Morning", sublabel: "Before school" },
  { id: "afternoon", label: "After School", sublabel: "15:30 - 17:30" },
  { id: "evening", label: "Evening", sublabel: "18:00 onwards" },
];

type ViewMode = "today" | "week" | "month";

export default function Timetable() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, activeChildId, loading: authLoading } = useAuth();

  const [sessions, setSessions] = useState<TimetableSession[]>([]);
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectLegend, setSubjectLegend] = useState<SubjectLegend[]>([]);

  // Redirect if not logged in or is a child
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    if (activeChildId) {
      navigate("/child/today", { replace: true });
      return;
    }
  }, [authLoading, user, activeChildId, navigate]);

  // Load children
  useEffect(() => {
    if (!user) return;

    async function loadChildren() {
      const { data, error } = await fetchChildrenForParent(user!.id);
      if (data && data.length > 0) {
        setChildren(data);
        
        // Check URL for child param
        const childFromUrl = searchParams.get("child");
        if (childFromUrl && data.some((c) => c.child_id === childFromUrl)) {
          setSelectedChildId(childFromUrl);
        } else {
          setSelectedChildId(data[0].child_id);
        }
      } else {
        setLoading(false);
        if (error) setError(error);
      }
    }

    loadChildren();
  }, [user, searchParams]);

  // Load sessions when child or date range changes
  useEffect(() => {
    if (!selectedChildId) return;

    async function loadSessions() {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = getDateRange(viewMode, referenceDate);
      const { data, error } = await fetchTimetableSessions(selectedChildId!, startDate, endDate);

      if (error) {
        setError(error);
        setSessions([]);
      } else {
        setSessions(data || []);
        setSubjectLegend(extractSubjectLegend(data || []));
      }
      setLoading(false);
    }

    loadSessions();
  }, [selectedChildId, viewMode, referenceDate]);

  // Get week start for current reference date
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const weekStart = getWeekStart(referenceDate);

  // Navigation
  const goToPrevious = () => {
    const newDate = new Date(referenceDate);
    if (viewMode === "today") {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setReferenceDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(referenceDate);
    if (viewMode === "today") {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setReferenceDate(newDate);
  };

  const goToToday = () => {
    setReferenceDate(new Date());
    setViewMode("week");
  };

  // Format the date range display
  const formatDateDisplay = (): string => {
    if (viewMode === "today") {
      return referenceDate.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    } else if (viewMode === "week") {
      const endOfWeek = new Date(weekStart);
      endOfWeek.setDate(weekStart.getDate() + 6);
      const startMonth = weekStart.toLocaleDateString("en-GB", { month: "short" });
      const endMonth = endOfWeek.toLocaleDateString("en-GB", { month: "short" });
      if (startMonth === endMonth) {
        return `${weekStart.getDate()} - ${endOfWeek.getDate()} ${startMonth}`;
      }
      return `${weekStart.getDate()} ${startMonth} - ${endOfWeek.getDate()} ${endMonth}`;
    } else {
      return referenceDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    }
  };

  // Get sessions for a specific day and time slot (week view)
  const getSessionsForSlot = (dayIndex: number, timeSlot: string): TimetableSession[] => {
    return sessions.filter((s) => {
      const sessionDayIndex = getDayIndex(s.session_date);
      // For now, put all sessions in "afternoon" slot
      return sessionDayIndex === dayIndex;
    });
  };

  // Get sessions for a specific date (today/month view)
  const getSessionsForDate = (date: Date): TimetableSession[] => {
    const dateStr = date.toISOString().split("T")[0];
    return sessions.filter((s) => s.session_date === dateStr);
  };

  // Calculate stats
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === "completed").length;
  const plannedSessions = sessions.filter((s) => s.status === "planned").length;

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center" style={{ backgroundColor: COLORS.neutral[100] }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: COLORS.primary[600] }} />
          <p className="text-sm" style={{ color: COLORS.neutral[600] }}>Loading timetable...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="min-h-[calc(100vh-73px)]" style={{ backgroundColor: COLORS.neutral[100] }}>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.primary[900] }}>
                Revision Timetable
              </h1>
              <p style={{ color: COLORS.neutral[600] }}>Weekly schedule and session planning</p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Child Selector */}
              <div
                className="relative flex items-center px-4 py-2 rounded-full border cursor-pointer"
                style={{ backgroundColor: COLORS.primary[50], borderColor: COLORS.primary[100] }}
              >
                <select
                  value={selectedChildId || ""}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="appearance-none bg-transparent border-none font-medium focus:outline-none cursor-pointer pr-6"
                  style={{ color: COLORS.primary[600] }}
                >
                  {children.map((child) => (
                    <option key={child.child_id} value={child.child_id}>
                      {child.child_name}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="absolute right-4 text-xs pointer-events-none"
                  style={{ color: COLORS.primary[600] }}
                />
              </div>
              <button
                className="px-6 py-2 text-white rounded-full hover:opacity-90 transition-colors flex items-center gap-2"
                style={{ backgroundColor: COLORS.primary[600] }}
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Session
              </button>
            </div>
          </div>
        </div>

        {/* Status Hero Card */}
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)" }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span
                  className="px-4 py-1.5 text-white text-sm font-medium rounded-full"
                  style={{ backgroundColor: plannedSessions > 0 ? COLORS.accent.green : COLORS.accent.amber }}
                >
                  {plannedSessions > 0 ? "Sessions Scheduled" : "No Sessions"}
                </span>
                <h2 className="text-xl font-semibold" style={{ color: COLORS.neutral[700] }}>
                  {plannedSessions > 0
                    ? `${plannedSessions} session${plannedSessions !== 1 ? "s" : ""} scheduled`
                    : "No sessions scheduled for this period"}
                </h2>
              </div>
              <p className="mb-4" style={{ color: COLORS.neutral[600] }}>
                {completedSessions > 0
                  ? `${completedSessions} of ${totalSessions} sessions completed.`
                  : plannedSessions > 0
                  ? "Sessions are ready to go!"
                  : "Add sessions to build a revision plan."}
              </p>
              {plannedSessions === 0 && (
                <div className="border rounded-xl p-4" style={{ backgroundColor: COLORS.primary[50], borderColor: COLORS.primary[200] }}>
                  <div className="flex items-start space-x-3">
                    <FontAwesomeIcon icon={faLightbulb} className="mt-1" style={{ color: COLORS.primary[600] }} />
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: COLORS.primary[900] }}>
                        Recommendation
                      </p>
                      <p className="text-sm" style={{ color: COLORS.neutral[600] }}>
                        Generate a revision plan to automatically schedule sessions based on your child's subjects and availability.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="ml-6 text-right">
              <div className="text-4xl font-bold mb-1" style={{ color: COLORS.primary[600] }}>
                {totalSessions}
              </div>
              <div className="text-sm" style={{ color: COLORS.neutral[500] }}>Total sessions</div>
            </div>
          </div>
        </div>

        {/* Timetable Controls */}
        <div className="bg-white rounded-2xl p-4 mb-6" style={{ boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPrevious}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              >
                <FontAwesomeIcon icon={faChevronLeft} style={{ color: COLORS.neutral[600] }} />
              </button>
              <h3 className="text-lg font-semibold min-w-[200px] text-center" style={{ color: COLORS.neutral[700] }}>
                {formatDateDisplay()}
              </h3>
              <button
                onClick={goToNext}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              >
                <FontAwesomeIcon icon={faChevronRight} style={{ color: COLORS.neutral[600] }} />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={goToToday}
                className="px-4 py-2 text-white rounded-full text-sm hover:opacity-90 transition-colors"
                style={{ backgroundColor: COLORS.primary[600] }}
              >
                Today
              </button>
              {(["week", "month"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="px-4 py-2 border rounded-full text-sm transition-colors"
                  style={{
                    backgroundColor: viewMode === mode ? COLORS.primary[50] : "white",
                    borderColor: viewMode === mode ? COLORS.primary[600] : COLORS.neutral[200],
                    color: viewMode === mode ? COLORS.primary[600] : COLORS.neutral[600],
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Week View Grid */}
        {viewMode === "week" && (
          <div className="bg-white rounded-2xl overflow-hidden mb-6" style={{ boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)" }}>
            {/* Header Row */}
            <div className="grid grid-cols-8 border-b" style={{ borderColor: COLORS.neutral[200] }}>
              <div className="p-4 border-r" style={{ backgroundColor: COLORS.neutral[50], borderColor: COLORS.neutral[200] }}>
                <div className="text-sm font-medium" style={{ color: COLORS.neutral[700] }}>Time</div>
              </div>
              {DAYS.map((day, index) => {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + index);
                const isToday = new Date().toDateString() === date.toDateString();

                return (
                  <div
                    key={day}
                    className="p-4 text-center border-r last:border-r-0"
                    style={{
                      backgroundColor: isToday ? COLORS.primary[50] : "white",
                      borderColor: COLORS.neutral[200],
                    }}
                  >
                    <div className="text-sm font-medium" style={{ color: isToday ? COLORS.primary[600] : COLORS.neutral[700] }}>
                      {day}
                    </div>
                    <div className="text-xs" style={{ color: isToday ? COLORS.primary[600] : COLORS.neutral[500] }}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Session Row (simplified - one row showing all sessions per day) */}
            <div className="grid grid-cols-8 min-h-[200px]">
              <div className="p-4 border-r flex items-start" style={{ backgroundColor: COLORS.neutral[50], borderColor: COLORS.neutral[200] }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: COLORS.neutral[700] }}>Sessions</div>
                  <div className="text-xs" style={{ color: COLORS.neutral[500] }}>All day</div>
                </div>
              </div>
              {DAYS.map((_, dayIndex) => {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + dayIndex);
                const daySessions = getSessionsForDate(date);

                return (
                  <div key={dayIndex} className="p-3 border-r last:border-r-0" style={{ borderColor: COLORS.neutral[200] }}>
                    {daySessions.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-xs" style={{ color: COLORS.neutral[400] }}>No sessions</span>
                      </div>
                    ) : (
                      daySessions.map((session) => (
                        <div
                          key={session.id}
                          className="rounded-lg p-3 mb-2 last:mb-0 cursor-pointer hover:opacity-90 transition-opacity"
                          style={{
                            backgroundColor: `${session.subject_color}15`,
                            borderLeft: `4px solid ${session.subject_color}`,
                          }}
                        >
                          <div className="text-sm font-semibold mb-1" style={{ color: session.subject_color }}>
                            {session.subject_name}
                          </div>
                          <div className="text-xs" style={{ color: COLORS.neutral[600] }}>
                            {session.topic_name || "Topics TBD"}
                          </div>
                          <div className="text-xs mt-2" style={{ color: COLORS.neutral[500] }}>
                            {session.session_duration_minutes} mins
                          </div>
                          {session.status === "completed" && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full text-white" style={{ backgroundColor: COLORS.accent.green }}>
                              Done
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Month View */}
        {viewMode === "month" && (
          <div className="bg-white rounded-2xl overflow-hidden mb-6" style={{ boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)" }}>
            <div className="p-6">
              <MonthCalendar
                referenceDate={referenceDate}
                sessions={sessions}
                colors={COLORS}
              />
            </div>
          </div>
        )}

        {/* Subject Legend */}
        {subjectLegend.length > 0 && (
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: COLORS.neutral[700] }}>
              Subject Legend
            </h3>
            <div className="flex flex-wrap gap-6">
              {subjectLegend.map((subject) => (
                <div key={subject.subject_id} className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: subject.subject_color }} />
                  <span className="text-sm" style={{ color: COLORS.neutral[600] }}>{subject.subject_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {sessions.length === 0 && !loading && (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: COLORS.primary[100] }}>
              <FontAwesomeIcon icon={faPlus} className="text-2xl" style={{ color: COLORS.primary[600] }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.primary[900] }}>
              No sessions scheduled
            </h3>
            <p className="mb-6 max-w-md mx-auto" style={{ color: COLORS.neutral[600] }}>
              There are no revision sessions scheduled for this period. Generate a plan or add sessions manually.
            </p>
            <button
              className="px-6 py-3 text-white rounded-full font-medium hover:opacity-90 transition-colors"
              style={{ backgroundColor: COLORS.primary[600] }}
            >
              Generate Revision Plan
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Month Calendar Component
 */
function MonthCalendar({
  referenceDate,
  sessions,
  colors,
}: {
  referenceDate: Date;
  sessions: TimetableSession[];
  colors: typeof COLORS;
}) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  
  // First day of month
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
  
  // Days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Get sessions for a day
  const getSessionsForDay = (day: number): TimetableSession[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return sessions.filter((s) => s.session_date === dateStr);
  };

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-sm font-medium py-2" style={{ color: colors.neutral[600] }}>
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-24" />;
          }
          
          const daySessions = getSessionsForDay(day);
          const isToday = isCurrentMonth && today.getDate() === day;
          
          return (
            <div
              key={day}
              className="h-24 border rounded-lg p-2 overflow-hidden"
              style={{
                borderColor: isToday ? colors.primary[600] : colors.neutral[200],
                backgroundColor: isToday ? colors.primary[50] : "white",
              }}
            >
              <div className="text-sm font-medium mb-1" style={{ color: isToday ? colors.primary[600] : colors.neutral[700] }}>
                {day}
              </div>
              <div className="space-y-1">
                {daySessions.slice(0, 2).map((session) => (
                  <div
                    key={session.id}
                    className="text-xs px-1.5 py-0.5 rounded truncate"
                    style={{
                      backgroundColor: `${session.subject_color}20`,
                      color: session.subject_color,
                    }}
                  >
                    {session.subject_name}
                  </div>
                ))}
                {daySessions.length > 2 && (
                  <div className="text-xs" style={{ color: colors.neutral[500] }}>
                    +{daySessions.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}