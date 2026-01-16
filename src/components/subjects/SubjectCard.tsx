// src/components/subjects/SubjectCard.tsx
// Updated: FEAT-010 - Consistent status colors

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
  faPray,
  faLanguage,
  faPalette,
  faMusic,
  faLaptopCode,
  faRunning,
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
    pray: faPray,
    language: faLanguage,
    palette: faPalette,
    music: faMusic,
    "laptop-code": faLaptopCode,
    running: faRunning,
  };
  return icons[icon] || faBook;
}

// Convert hex color to rgba with alpha
function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// FEAT-010: Consistent status colors
function getStatusStyle(status: string) {
  switch (status) {
    case "in_progress":
      return {
        label: "On Track",
        bgColor: "#1EC592",
      };
    case "needs_attention":
      return {
        label: "Needs Focus",
        bgColor: "#E69B2C", // Updated: darker amber for consistency
      };
    case "completed":
      return {
        label: "Completed",
        bgColor: "#7C3AED", // Purple
      };
    default:
      return {
        label: "Not Started",
        bgColor: "#A8AEBD",
      };
  }
}

export default function SubjectCard({ subject }: SubjectCardProps) {
  const statusStyle = getStatusStyle(subject.status);
  const recentlyCovered = subject.recently_covered?.slice(0, 3) || [];
  const comingUp = subject.coming_up?.slice(0, 3) || [];
  const subjectColor = subject.subject_color || "#5B2CFF";

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: hexToRgba(subjectColor, 0.1) }}
          >
            <FontAwesomeIcon
              icon={getSubjectIcon(subject.subject_icon)}
              className="text-lg"
              style={{ color: subjectColor }}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "#1F2330" }}>
              {subject.subject_name}
            </h3>
            <p className="text-sm" style={{ color: "#6C7280" }}>
              {subject.exam_type || "GCSE"} • {subject.exam_board_name || "Edexcel"}
            </p>
          </div>
        </div>
        
        {/* Status badge - solid background with white text */}
        <span
          className="px-3 py-1 text-white text-sm rounded-full font-medium"
          style={{ backgroundColor: statusStyle.bgColor }}
        >
          {statusStyle.label}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div>
          <div className="text-sm mb-2" style={{ color: "#4B5161" }}>
            <span className="font-medium">Recently covered:</span>{" "}
            <span style={{ color: "#6C7280" }}>
              {recentlyCovered.length > 0
                ? recentlyCovered.map((t) => t.topic_name).join(", ")
                : "No topics covered yet"}
            </span>
          </div>
          <div className="text-sm" style={{ color: "#4B5161" }}>
            <span className="font-medium">Coming up next:</span>{" "}
            <span style={{ color: "#6C7280" }}>
              {comingUp.length > 0
                ? comingUp.map((t) => t.topic_name).join(", ")
                : "No upcoming topics scheduled"}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: "#6C7280" }}>Coverage progress</span>
            <span className="font-medium" style={{ color: "#1F2330" }}>
              {subject.completion_percentage}% complete
            </span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: "#E1E4EE" }}>
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(subject.completion_percentage, 100)}%`,
                backgroundColor: subjectColor,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}