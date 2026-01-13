// src/pages/parent/Timetable.tsx

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../contexts/AuthContext";
import { PageLayout } from "../../components/layout";
import TimetableHeroCard from "../../components/timetable/TimetableHeroCard";
import TimetableActionCards from "../../components/timetable/TimetableActionCards";
import TodayView from "../../components/timetable/TodayView";
import AddSessionModal from "../../components/timetable/AddSessionModal";
import BlockDatesModal from "../../components/timetable/BlockDatesModal";
import {
  fetchChildrenForParent,
  fetchWeekPlan,
  fetchMonthSessions,
  fetchTodaySessions,
  fetchPlanCoverageOverview,
  fetchDateOverrides,
  extractSubjectLegend,
  getWeekStart,
  formatDateISO,
  formatDateRange,
  calculateWeekStats,
  getTopicNames,
  type WeekDayData,
  type TimetableSession,
  type ChildOption,
  type SubjectLegend,
  type PlanCoverageOverview,
  type DateOverride,
} from "../../services/timetableService";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type ViewMode = "today" | "week" | "month";

export default function Timetable() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, activeChildId, loading: authLoading } = useAuth();

  // State
  const [weekData, setWeekData] = useState<WeekDayData[]>([]);
  const [todaySessions, setTodaySessions] = useState<TimetableSession[]>([]);
  const [monthSessions, setMonthSessions] = useState<TimetableSession[]>([]);
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectLegend, setSubjectLegend] = useState<SubjectLegend[]>([]);
  const [planOverview, setPlanOverview] = useState<PlanCoverageOverview | null>(null);
  const [planOverviewLoading, setPlanOverviewLoading] = useState(true);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);

  // Modal state
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [showBlockDatesModal, setShowBlockDatesModal] = useState(false);

  // Get selected child name
  const selectedChildName =
    children.find((c) => c.child_id === selectedChildId)?.child_name || "Child";

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

  // Load plan overview when child changes
  useEffect(() => {
    if (!selectedChildId) return;

    async function loadPlanOverview() {
      setPlanOverviewLoading(true);
      const { data } = await fetchPlanCoverageOverview(selectedChildId!);
      setPlanOverview(data);
      setPlanOverviewLoading(false);
    }

    async function loadOverrides() {
      const { data } = await fetchDateOverrides(selectedChildId!);
      setDateOverrides(data || []);
    }

    loadPlanOverview();
    loadOverrides();
  }, [selectedChildId]);

  // Load sessions when child or date changes
  useEffect(() => {
    if (!selectedChildId) return;

    async function loadSessions() {
      setLoading(true);
      setError(null);

      if (viewMode === "today") {
        // Fetch today/single day sessions
        const { data, error } = await fetchTodaySessions(
          selectedChildId!,
          formatDateISO(referenceDate)
        );

        if (error) {
          setError(error);
          setTodaySessions([]);
        } else {
          setTodaySessions(data || []);
          // Build legend from today sessions
          const legend: SubjectLegend[] = [];
          const seen = new Set<string>();
          (data || []).forEach((s) => {
            if (!seen.has(s.subject_id)) {
              seen.add(s.subject_id);
              legend.push({
                subject_id: s.subject_id,
                subject_name: s.subject_name,
                subject_color: s.color,
              });
            }
          });
          setSubjectLegend(legend);
        }
      } else if (viewMode === "month") {
        // Fetch month sessions
        const { data, error } = await fetchMonthSessions(
          selectedChildId!,
          referenceDate.getFullYear(),
          referenceDate.getMonth()
        );

        if (error) {
          setError(error);
          setMonthSessions([]);
        } else {
          setMonthSessions(data || []);
          const legend: SubjectLegend[] = [];
          const seen = new Set<string>();
          (data || []).forEach((s) => {
            if (!seen.has(s.subject_id)) {
              seen.add(s.subject_id);
              legend.push({
                subject_id: s.subject_id,
                subject_name: s.subject_name,
                subject_color: s.color,
              });
            }
          });
          setSubjectLegend(legend);
        }
      } else {
        // Fetch week plan
        const weekStart = getWeekStart(referenceDate);
        const { data, error } = await fetchWeekPlan(
          selectedChildId!,
          formatDateISO(weekStart)
        );

        if (error) {
          setError(error);
          setWeekData([]);
        } else {
          setWeekData(data || []);
          setSubjectLegend(extractSubjectLegend(data || []));
        }
      }

      setLoading(false);
    }

    loadSessions();
  }, [selectedChildId, viewMode, referenceDate]);

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
  };

  // Calculate stats
  const stats = calculateWeekStats(weekData);
  const weekStart = getWeekStart(referenceDate);

  // Check if a date is blocked
  const isDateBlocked = (dateStr: string): boolean => {
    return dateOverrides.some(
      (o) => o.override_date === dateStr && o.override_type === "blocked"
    );
  };

  // Handlers
  const handleSessionAdded = () => {
    // Refresh calendar data
    setReferenceDate(new Date(referenceDate)); // Trigger reload
    // Refresh plan overview
    if (selectedChildId) {
      fetchPlanCoverageOverview(selectedChildId).then(({ data }) => {
        setPlanOverview(data);
      });
    }
  };

  const handleDatesChanged = () => {
    // Refresh overrides and plan overview
    if (selectedChildId) {
      fetchDateOverrides(selectedChildId).then(({ data }) => {
        setDateOverrides(data || []);
      });
      fetchPlanCoverageOverview(selectedChildId).then(({ data }) => {
        setPlanOverview(data);
      });
    }
  };

  const handleEditSchedule = () => {
    // Navigate to onboarding availability step or dedicated page
    navigate(`/parent/child/${selectedChildId}/schedule`);
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-neutral-600">Loading timetable...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!user || !profile) return null;

  return (
    <PageLayout>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary-900">
              Revision Timetable
            </h1>
            <p className="text-neutral-600">
              Weekly schedule and session planning
            </p>
          </div>

          {/* Child Selector */}
          <div className="relative flex items-center px-4 py-2 rounded-full border cursor-pointer bg-primary-50 border-primary-100">
            <select
              value={selectedChildId || ""}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="appearance-none bg-transparent border-none font-medium focus:outline-none cursor-pointer pr-6 text-primary-600"
            >
              {children.map((child) => (
                <option key={child.child_id} value={child.child_id}>
                  {child.child_name}
                </option>
              ))}
            </select>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="absolute right-4 text-xs pointer-events-none text-primary-600"
            />
          </div>
        </div>

        {/* Hero Card - Plan Overview */}
        <TimetableHeroCard
          planOverview={planOverview}
          loading={planOverviewLoading}
        />

        {/* Action Cards */}
        <TimetableActionCards
          onAddSession={() => setShowAddSessionModal(true)}
          onEditSchedule={handleEditSchedule}
          onBlockDates={() => setShowBlockDatesModal(true)}
        />

        {/* Timetable Controls */}
        <div className="bg-white rounded-2xl shadow-soft p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPrevious}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-neutral-600" />
              </button>
              <h3 className="text-lg font-semibold min-w-[200px] text-center text-neutral-700">
                {formatDateRange(viewMode, referenceDate)}
              </h3>
              <button
                onClick={goToNext}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-neutral-600" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {(["today", "week", "month"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setViewMode(mode);
                    // If clicking Today, also go to today's date
                    if (mode === "today") {
                      setReferenceDate(new Date());
                    }
                  }}
                  className={`px-4 py-2 border rounded-full text-sm transition-colors ${
                    viewMode === mode
                      ? "bg-primary-50 border-primary-600 text-primary-600"
                      : "bg-white border-neutral-200 text-neutral-600"
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Today View */}
        {viewMode === "today" && (
          <TodayView
            sessions={todaySessions}
            date={referenceDate}
            onAddSession={() => setShowAddSessionModal(true)}
            loading={loading}
          />
        )}

        {/* Week View Grid */}
        {viewMode === "week" && (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-6">
            {/* Header Row */}
            <div className="grid grid-cols-8 border-b border-neutral-200">
              <div className="p-4 border-r bg-neutral-50 border-neutral-200">
                <div className="text-sm font-medium text-neutral-700">Time</div>
              </div>
              {DAYS.map((day, index) => {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + index);
                const dateStr = formatDateISO(date);
                const isToday = new Date().toDateString() === date.toDateString();
                const isBlocked = isDateBlocked(dateStr);

                return (
                  <div
                    key={day}
                    className={`p-4 text-center border-r last:border-r-0 border-neutral-200 ${
                      isBlocked
                        ? "bg-neutral-200"
                        : isToday
                        ? "bg-primary-50"
                        : "bg-white"
                    }`}
                  >
                    <div
                      className={`text-sm font-medium ${
                        isBlocked
                          ? "text-neutral-500"
                          : isToday
                          ? "text-primary-600"
                          : "text-neutral-700"
                      }`}
                    >
                      {day}
                    </div>
                    <div
                      className={`text-xs ${
                        isBlocked
                          ? "text-neutral-400"
                          : isToday
                          ? "text-primary-600"
                          : "text-neutral-500"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    {isBlocked && (
                      <div className="text-xs text-neutral-400 mt-1">Blocked</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Session Row */}
            <div className="grid grid-cols-8 min-h-[200px]">
              <div className="p-4 border-r flex items-start bg-neutral-50 border-neutral-200">
                <div>
                  <div className="text-sm font-medium text-neutral-700">Sessions</div>
                  <div className="text-xs text-neutral-500">All day</div>
                </div>
              </div>
              {DAYS.map((_, dayIndex) => {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + dayIndex);
                const dateStr = formatDateISO(date);
                const isBlocked = isDateBlocked(dateStr);

                const dayData = weekData.find((d) => d.day_date === dateStr);
                const daySessions = dayData?.sessions || [];

                return (
                  <div
                    key={dayIndex}
                    className={`p-3 border-r last:border-r-0 border-neutral-200 ${
                      isBlocked ? "bg-neutral-100" : ""
                    }`}
                  >
                    {isBlocked ? (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-xs text-neutral-400 italic">
                          No revision
                        </span>
                      </div>
                    ) : daySessions.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-xs text-neutral-400">No sessions</span>
                      </div>
                    ) : (
                      daySessions.map((session) => (
                        <div
                          key={session.planned_session_id}
                          className="rounded-lg p-3 mb-2 last:mb-0 cursor-pointer hover:opacity-90 transition-opacity"
                          style={{
                            backgroundColor: `${session.color}15`,
                            borderLeft: `4px solid ${session.color}`,
                          }}
                        >
                          <div
                            className="text-sm font-semibold mb-1"
                            style={{ color: session.color }}
                          >
                            {session.subject_name}
                          </div>
                          <div className="text-xs text-neutral-600">
                            {getTopicNames(session)}
                          </div>
                          <div className="text-xs mt-2 text-neutral-500">
                            {session.session_duration_minutes} mins
                          </div>
                          {session.status === "completed" && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full text-white bg-accent-green">
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
          <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-6">
            <div className="p-6">
              <MonthCalendar
                referenceDate={referenceDate}
                sessions={monthSessions}
                blockedDates={dateOverrides
                  .filter((o) => o.override_type === "blocked")
                  .map((o) => o.override_date)}
              />
            </div>
          </div>
        )}

        {/* Subject Legend */}
        {subjectLegend.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-sm font-semibold mb-4 text-neutral-700">
              Subject Legend
            </h3>
            <div className="flex flex-wrap gap-6">
              {subjectLegend.map((subject) => (
                <div key={subject.subject_id} className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: subject.subject_color }}
                  />
                  <span className="text-sm text-neutral-600">
                    {subject.subject_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AddSessionModal
        isOpen={showAddSessionModal}
        onClose={() => setShowAddSessionModal(false)}
        childId={selectedChildId || ""}
        selectedDate={viewMode === "today" ? referenceDate : undefined}
        onSessionAdded={handleSessionAdded}
        onEditSchedule={handleEditSchedule}
      />

      <BlockDatesModal
        isOpen={showBlockDatesModal}
        onClose={() => setShowBlockDatesModal(false)}
        childId={selectedChildId || ""}
        childName={selectedChildName}
        onDatesChanged={handleDatesChanged}
      />
    </PageLayout>
  );
}

/**
 * Month Calendar Component
 */
function MonthCalendar({
  referenceDate,
  sessions,
  blockedDates = [],
}: {
  referenceDate: Date;
  sessions: TimetableSession[];
  blockedDates?: string[];
}) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const getSessionsForDay = (day: number): TimetableSession[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return sessions.filter((s) => s.session_date === dateStr);
  };

  const isBlocked = (day: number): boolean => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return blockedDates.includes(dateStr);
  };

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-sm font-medium py-2 text-neutral-600">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-24" />;
          }

          const daySessions = getSessionsForDay(day);
          const isToday = isCurrentMonth && today.getDate() === day;
          const dayBlocked = isBlocked(day);

          return (
            <div
              key={day}
              className={`h-24 border rounded-lg p-2 overflow-hidden ${
                dayBlocked
                  ? "border-neutral-300 bg-neutral-100"
                  : isToday
                  ? "border-primary-600 bg-primary-50"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  dayBlocked
                    ? "text-neutral-400"
                    : isToday
                    ? "text-primary-600"
                    : "text-neutral-700"
                }`}
              >
                {day}
              </div>
              {dayBlocked ? (
                <div className="text-xs text-neutral-400 italic">Blocked</div>
              ) : (
                <div className="space-y-1">
                  {daySessions.slice(0, 2).map((session) => (
                    <div
                      key={session.planned_session_id}
                      className="text-xs px-1.5 py-0.5 rounded truncate"
                      style={{
                        backgroundColor: `${session.color}20`,
                        color: session.color,
                      }}
                    >
                      {session.subject_name}
                    </div>
                  ))}
                  {daySessions.length > 2 && (
                    <div className="text-xs text-neutral-500">
                      +{daySessions.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}