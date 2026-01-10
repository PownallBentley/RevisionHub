// src/pages/parent/Timetable.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faPlus,
  faLightbulb,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../contexts/AuthContext";

// Types for timetable data
interface TimetableSession {
  id: string;
  subject_name: string;
  subject_color: string;
  topic_name: string;
  start_time: string;
  end_time: string;
  child_name: string;
  day_index: number; // 0 = Monday, 6 = Sunday
  time_slot: "morning" | "afternoon" | "evening";
}

interface ChildOption {
  child_id: string;
  child_name: string;
}

// Mock data for demonstration - replace with actual RPC call
const MOCK_SESSIONS: TimetableSession[] = [
  {
    id: "1",
    subject_name: "Maths",
    subject_color: "#5B2CFF",
    topic_name: "Algebra - Quadratics",
    start_time: "16:00",
    end_time: "17:00",
    child_name: "Emma",
    day_index: 0,
    time_slot: "afternoon",
  },
  {
    id: "2",
    subject_name: "English",
    subject_color: "#1EC592",
    topic_name: "Poetry Analysis",
    start_time: "10:00",
    end_time: "11:30",
    child_name: "Emma",
    day_index: 5,
    time_slot: "morning",
  },
  {
    id: "3",
    subject_name: "Science",
    subject_color: "#3B82F6",
    topic_name: "Biology - Cells",
    start_time: "16:00",
    end_time: "17:00",
    child_name: "Emma",
    day_index: 0,
    time_slot: "afternoon",
  },
  {
    id: "4",
    subject_name: "Maths",
    subject_color: "#5B2CFF",
    topic_name: "Geometry - Circles",
    start_time: "16:00",
    end_time: "17:30",
    child_name: "Emma",
    day_index: 2,
    time_slot: "afternoon",
  },
  {
    id: "5",
    subject_name: "Science",
    subject_color: "#3B82F6",
    topic_name: "Chemistry - Atoms",
    start_time: "19:00",
    end_time: "20:00",
    child_name: "Emma",
    day_index: 1,
    time_slot: "evening",
  },
  {
    id: "6",
    subject_name: "English",
    subject_color: "#1EC592",
    topic_name: "Essay Writing",
    start_time: "16:30",
    end_time: "18:00",
    child_name: "Emma",
    day_index: 4,
    time_slot: "afternoon",
  },
  {
    id: "7",
    subject_name: "English",
    subject_color: "#1EC592",
    topic_name: "Shakespeare",
    start_time: "19:00",
    end_time: "20:30",
    child_name: "Emma",
    day_index: 3,
    time_slot: "evening",
  },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = [
  { id: "morning", label: "Morning", sublabel: "08:00 - 12:00" },
  { id: "afternoon", label: "After School", sublabel: "15:30 - 17:30" },
  { id: "evening", label: "Evening", sublabel: "18:00 - 20:30" },
];

export default function Timetable() {
  const navigate = useNavigate();
  const { user, profile, activeChildId, loading: authLoading } = useAuth();

  const [sessions, setSessions] = useState<TimetableSession[]>([]);
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [loading, setLoading] = useState(true);

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

  // Load data
  useEffect(() => {
    if (!user) return;

    // TODO: Replace with actual RPC calls
    // For now, use mock data
    setChildren([
      { child_id: "1", child_name: "Emma Thompson" },
      { child_id: "2", child_name: "Oliver Thompson" },
    ]);
    setSelectedChildId("1");
    setSessions(MOCK_SESSIONS);
    setLoading(false);
  }, [user]);

  // Get sessions for a specific day and time slot
  const getSessionsForSlot = (dayIndex: number, timeSlot: string) => {
    return sessions.filter(
      (s) => s.day_index === dayIndex && s.time_slot === timeSlot
    );
  };

  // Format week range
  const formatWeekRange = () => {
    const endOfWeek = new Date(currentWeekStart);
    endOfWeek.setDate(currentWeekStart.getDate() + 6);

    const startMonth = currentWeekStart.toLocaleDateString("en-GB", { month: "short" });
    const endMonth = endOfWeek.toLocaleDateString("en-GB", { month: "short" });
    const startDay = currentWeekStart.getDate();
    const endDay = endOfWeek.getDate();

    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${startMonth}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  };

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  // Calculate weekly target percentage (mock for now)
  const weeklyTargetPercent = 78;
  const needsMoreSessions = weeklyTargetPercent < 100;

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-neutral-600">Loading timetable...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-neutral-100">
      <main className="max-w-content mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-primary-900 mb-2">Revision Timetable</h1>
              <p className="text-neutral-600">Weekly schedule and session planning</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedChildId || ""}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="px-4 py-2 border border-neutral-200 rounded-pill text-neutral-700 bg-white focus:outline-none focus:border-primary-300"
              >
                {children.map((child) => (
                  <option key={child.child_id} value={child.child_id}>
                    {child.child_name}
                  </option>
                ))}
              </select>
              <button className="px-6 py-2 bg-primary-600 text-white rounded-pill hover:bg-primary-700 transition-colors flex items-center gap-2">
                <FontAwesomeIcon icon={faPlus} />
                Add Session
              </button>
            </div>
          </div>
        </div>

        {/* Status Hero Card */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className={`px-4 py-1.5 ${needsMoreSessions ? "bg-accent-amber" : "bg-accent-green"} text-white text-sm font-medium rounded-pill`}>
                  {needsMoreSessions ? "Suggest More Sessions" : "On Track"}
                </span>
                <h2 className="text-xl font-semibold text-neutral-700">
                  {needsMoreSessions ? "Schedule needs adjustment" : "Great progress this week!"}
                </h2>
              </div>
              <p className="text-neutral-600 mb-4">
                {needsMoreSessions
                  ? "Maths and Science are below target hours for this week. Current plan may not achieve predicted grades."
                  : "All subjects are on track for the week. Keep up the good work!"}
              </p>
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <FontAwesomeIcon icon={faLightbulb} className="text-primary-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-primary-900 mb-1">Recommendation</p>
                    <p className="text-sm text-neutral-600">
                      {needsMoreSessions
                        ? "Add 2 more sessions to raise predicted grade in English to 6. Consider adding 1 Maths session and 1 Science session this week."
                        : "Continue with the current schedule. Consider reviewing any topics marked as needing attention."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-6 text-right">
              <div className={`text-4xl font-bold ${needsMoreSessions ? "text-accent-amber" : "text-accent-green"} mb-1`}>
                {weeklyTargetPercent}%
              </div>
              <div className="text-sm text-neutral-500">Weekly target</div>
            </div>
          </div>
        </div>

        {/* Timetable Controls */}
        <div className="bg-white rounded-2xl shadow-soft p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPreviousWeek}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-neutral-600" />
              </button>
              <h3 className="text-lg font-semibold text-neutral-700 min-w-[160px] text-center">
                {formatWeekRange()}
              </h3>
              <button
                onClick={goToNextWeek}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-neutral-600" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-primary-600 text-white rounded-pill text-sm hover:bg-primary-700 transition-colors"
              >
                Today
              </button>
              <button className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-pill text-sm hover:bg-neutral-50 transition-colors">
                Week
              </button>
              <button className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-pill text-sm hover:bg-neutral-50 transition-colors">
                Month
              </button>
            </div>
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-6">
          {/* Header Row */}
          <div className="grid grid-cols-8 border-b border-neutral-200">
            <div className="p-4 bg-neutral-50 border-r border-neutral-200">
              <div className="text-sm font-medium text-neutral-700">Time</div>
            </div>
            {DAYS.map((day, index) => {
              const date = new Date(currentWeekStart);
              date.setDate(currentWeekStart.getDate() + index);
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div
                  key={day}
                  className={`p-4 text-center border-r border-neutral-200 last:border-r-0 ${
                    isToday ? "bg-primary-50" : ""
                  }`}
                >
                  <div className={`text-sm font-medium ${isToday ? "text-primary-600" : "text-neutral-700"}`}>
                    {day}
                  </div>
                  <div className={`text-xs ${isToday ? "text-primary-500" : "text-neutral-500"}`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Slots */}
          {TIME_SLOTS.map((slot) => (
            <div key={slot.id} className="grid grid-cols-8 border-b border-neutral-200 last:border-b-0 min-h-[120px]">
              {/* Time Label */}
              <div className="p-4 bg-neutral-50 border-r border-neutral-200 flex items-start">
                <div>
                  <div className="text-sm font-medium text-neutral-700">{slot.label}</div>
                  <div className="text-xs text-neutral-500">{slot.sublabel}</div>
                </div>
              </div>

              {/* Day Cells */}
              {DAYS.map((_, dayIndex) => {
                const slotSessions = getSessionsForSlot(dayIndex, slot.id);

                return (
                  <div
                    key={dayIndex}
                    className="p-3 border-r border-neutral-200 last:border-r-0"
                  >
                    {slotSessions.map((session) => (
                      <div
                        key={session.id}
                        className="rounded-lg p-3 mb-2 last:mb-0"
                        style={{
                          backgroundColor: `${session.subject_color}15`,
                          borderLeft: `4px solid ${session.subject_color}`,
                        }}
                      >
                        <div
                          className="text-sm font-semibold mb-1"
                          style={{ color: session.subject_color }}
                        >
                          {session.subject_name}
                        </div>
                        <div className="text-xs text-neutral-600">{session.topic_name}</div>
                        <div className="text-xs text-neutral-500 mt-2">
                          {session.start_time} - {session.end_time}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-4">Subject Legend</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-primary-600 rounded" />
              <span className="text-sm text-neutral-600">Maths</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-accent-green rounded" />
              <span className="text-sm text-neutral-600">English</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded" />
              <span className="text-sm text-neutral-600">Science</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-600 rounded" />
              <span className="text-sm text-neutral-600">History</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-600 rounded" />
              <span className="text-sm text-neutral-600">Geography</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}