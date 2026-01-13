// src/components/timetable/TodayView.tsx

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faCheck,
  faClock,
  faBook,
  faCalculator,
  faFlask,
  faAtom,
  faGlobe,
  faLandmark,
  faLanguage,
  faPalette,
  faMusic,
  faMicroscope,
  faLaptopCode,
  faDumbbell,
  faPray,
  faLeaf,
  faTheaterMasks,
  faUtensils,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import type { TimetableSession } from "../../services/timetableService";

// Icon mapping from database icon names to FontAwesome icons
const ICON_MAP: Record<string, IconDefinition> = {
  calculator: faCalculator,
  flask: faFlask,
  atom: faAtom,
  globe: faGlobe,
  landmark: faLandmark,
  language: faLanguage,
  palette: faPalette,
  music: faMusic,
  microscope: faMicroscope,
  "laptop-code": faLaptopCode,
  dumbbell: faDumbbell,
  pray: faPray,
  leaf: faLeaf,
  "theater-masks": faTheaterMasks,
  utensils: faUtensils,
  book: faBook,
};

interface TodayViewProps {
  sessions: TimetableSession[];
  date: Date;
  onAddSession: () => void;
  loading?: boolean;
}

export default function TodayView({
  sessions,
  date,
  onAddSession,
  loading = false,
}: TodayViewProps) {
  const formatTime = (index: number): string => {
    // Approximate time slots based on session index
    const baseHour = 16; // 4 PM
    const hour = baseHour + Math.floor(index * 0.75);
    return `${hour}:00`;
  };

  const getIcon = (iconName: string): IconDefinition => {
    return ICON_MAP[iconName] || faBook;
  };

  const isToday = new Date().toDateString() === date.toDateString();
  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-64 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-neutral-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 border-b ${isToday ? "bg-primary-50 border-primary-200" : "bg-neutral-50 border-neutral-200"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${isToday ? "text-primary-700" : "text-neutral-700"}`}>
              {date.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""} scheduled
              {isToday && " • Today"}
            </p>
          </div>
          {!isPast && (
            <button
              onClick={onAddSession}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Session
            </button>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="p-6">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faBook} className="text-2xl text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">
              No sessions scheduled
            </h3>
            <p className="text-neutral-500 mb-4">
              {isPast 
                ? "No revision was scheduled for this day."
                : "Add a session to start revising on this day."}
            </p>
            {!isPast && (
              <button
                onClick={onAddSession}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Add Session
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, index) => {
              const isCompleted = session.status === "completed";
              const isStarted = session.status === "started";

              return (
                <div
                  key={session.planned_session_id}
                  className={`rounded-xl border-2 p-4 transition-all hover:shadow-md cursor-pointer ${
                    isCompleted
                      ? "bg-accent-green/5 border-accent-green/30"
                      : isStarted
                      ? "bg-primary-50 border-primary-300"
                      : "bg-white border-neutral-200 hover:border-primary-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Time Column */}
                    <div className="w-16 text-center shrink-0">
                      <div className="text-sm font-medium text-neutral-500">
                        {formatTime(index)}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {session.session_duration_minutes}m
                      </div>
                    </div>

                    {/* Subject Icon */}
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isCompleted
                          ? `${session.color}20`
                          : session.color,
                      }}
                    >
                      <FontAwesomeIcon
                        icon={getIcon(session.icon)}
                        className="text-xl"
                        style={{
                          color: isCompleted ? session.color : "white",
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3
                            className="font-semibold text-lg"
                            style={{ color: session.color }}
                          >
                            {session.subject_name}
                          </h3>
                          <p className="text-sm text-neutral-600 mt-0.5">
                            {session.topics_preview && session.topics_preview.length > 0
                              ? session.topics_preview.map((t) => t.topic_name).join(", ")
                              : "Topics to be assigned"}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent-green text-white text-sm font-medium rounded-full">
                              <FontAwesomeIcon icon={faCheck} className="text-xs" />
                              Done
                            </span>
                          ) : isStarted ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-600 text-white text-sm font-medium rounded-full">
                              <FontAwesomeIcon icon={faClock} className="text-xs" />
                              In Progress
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-600 text-sm font-medium rounded-full">
                              <FontAwesomeIcon icon={faClock} className="text-xs" />
                              Planned
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Session Pattern */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faClock} />
                          {session.session_pattern === "SINGLE_20"
                            ? "20 min session"
                            : session.session_pattern === "DOUBLE_45"
                            ? "45 min session"
                            : "70 min session"}
                        </span>
                        <span>•</span>
                        <span>
                          {session.topic_count} topic{session.topic_count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}