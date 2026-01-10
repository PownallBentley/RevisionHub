// src/components/subjects/SubjectCard.tsx

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalculator,
  faFlask,
  faBook,
  faDna,
  faGlobe,
  faLandmark,
  faScroll,
  faAtom,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import type { SubjectProgress } from "../../types/subjectProgress";

interface SubjectCardProps {
  subject: SubjectProgress;
}

// Get FontAwesome icon for subject
function getSubjectIcon(icon: string) {
  const icons: Record<string, any> = {
    calculator: faCalculator,
    flask: faFlask,
    book: faBook,
    dna: faDna,
    globe: faGlobe,
    landmark: faLandmark,
    scroll: faScroll,
    atom: faAtom,
  };
  return icons[icon] || faBook;
}

// Get status style
function getStatusStyle(status: string) {
  switch (status) {
    case "in_progress":
      return {
        label: "On Track",
        bgColor: "bg-accent-green",
        textColor: "text-white",
      };
    case "needs_attention":
      return {
        label: "Needs Attention",
        bgColor: "bg-accent-amber",
        textColor: "text-white",
      };
    case "completed":
      return {
        label: "Completed",
        bgColor: "bg-primary-600",
        textColor: "text-white",
      };
    default:
      return {
        label: "Not Started",
        bgColor: "bg-neutral-200",
        textColor: "text-neutral-600",
      };
  }
}

export default function SubjectCard({ subject }: SubjectCardProps) {
  const statusStyle = getStatusStyle(subject.status);

  // Get recently covered topics (last 3)
  const recentlyCovered = subject.recently_covered.slice(0, 3);
  const comingUp = subject.coming_up.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${subject.subject_color}15` }}
          >
            <FontAwesomeIcon
              icon={getSubjectIcon(subject.subject_icon)}
              className="text-lg"
              style={{ color: subject.subject_color }}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-700">{subject.subject_name}</h3>
            <p className="text-sm text-neutral-500">
              {subject.exam_type || "GCSE"} • {subject.exam_board_name || "Edexcel"}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 ${statusStyle.bgColor} ${statusStyle.textColor} text-sm rounded-pill flex items-center gap-1`}>
          <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
          {statusStyle.label}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div>
          <div className="text-sm text-neutral-600 mb-2">
            <span className="font-medium">Recently covered:</span>{" "}
            {recentlyCovered.length > 0
              ? recentlyCovered.map((t) => t.topic_name).join(", ")
              : "No topics covered yet"}
          </div>
          <div className="text-sm text-neutral-600">
            <span className="font-medium">Coming up next:</span>{" "}
            {comingUp.length > 0
              ? comingUp.map((t) => t.topic_name).join(", ")
              : "No upcoming topics scheduled"}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Coverage progress</span>
            <span className="font-medium text-neutral-700">{subject.completion_percentage}% complete</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${subject.completion_percentage}%`,
                backgroundColor: subject.subject_color,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}