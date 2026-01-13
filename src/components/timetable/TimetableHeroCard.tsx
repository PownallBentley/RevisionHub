// src/components/timetable/TimetableHeroCard.tsx

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faExclamationTriangle,
  faTimesCircle,
  faClock,
  faLayerGroup,
  faCalendarCheck,
} from "@fortawesome/free-solid-svg-icons";
import type { FeasibilityStatus } from "../../services/timetableService";

type ViewTab = "sessions" | "coverage" | "time";

interface TimetableHeroCardProps {
  feasibility: FeasibilityStatus | null;
  weekStats: {
    totalSessions: number;
    completedSessions: number;
    plannedSessions: number;
    totalMinutes: number;
  };
  loading?: boolean;
}

export default function TimetableHeroCard({
  feasibility,
  weekStats,
  loading = false,
}: TimetableHeroCardProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>("sessions");

  // Traffic light status
  const getStatusConfig = () => {
    if (!feasibility) {
      return {
        color: "bg-neutral-400",
        textColor: "text-neutral-600",
        icon: faExclamationTriangle,
        label: "Unknown",
        description: "Unable to calculate coverage",
      };
    }

    switch (feasibility.status) {
      case "good":
        return {
          color: "bg-accent-green",
          textColor: "text-accent-green",
          icon: faCheckCircle,
          label: "Good Coverage",
          description: `${feasibility.plannedSessions} sessions planned — you're on track!`,
        };
      case "marginal":
        return {
          color: "bg-accent-amber",
          textColor: "text-accent-amber",
          icon: faExclamationTriangle,
          label: "Marginal",
          description: `${feasibility.plannedSessions} of ${feasibility.withContingency} sessions — consider adding more`,
        };
      case "insufficient":
        return {
          color: "bg-accent-red",
          textColor: "text-accent-red",
          icon: faTimesCircle,
          label: "Needs Attention",
          description: `${feasibility.shortfall} more sessions needed to meet target`,
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "sessions":
        return (
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {feasibility?.plannedSessions || weekStats.totalSessions}
              </div>
              <div className="text-sm text-neutral-500">Total Planned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-green">
                {weekStats.completedSessions}
              </div>
              <div className="text-sm text-neutral-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-neutral-600">
                {weekStats.plannedSessions}
              </div>
              <div className="text-sm text-neutral-500">Remaining</div>
            </div>
          </div>
        );

      case "coverage":
        return (
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {feasibility?.recommendedSessions || 0}
              </div>
              <div className="text-sm text-neutral-500">Recommended</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {feasibility?.plannedSessions || 0}
              </div>
              <div className="text-sm text-neutral-500">Planned</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                (feasibility?.surplus || 0) > 0 ? "text-accent-green" : "text-accent-red"
              }`}>
                {(feasibility?.surplus || 0) > 0 
                  ? `+${feasibility?.surplus}` 
                  : `-${feasibility?.shortfall || 0}`}
              </div>
              <div className="text-sm text-neutral-500">
                {(feasibility?.surplus || 0) > 0 ? "Surplus" : "Shortfall"}
              </div>
            </div>
          </div>
        );

      case "time":
        const totalHours = Math.floor(weekStats.totalMinutes / 60);
        const remainingMins = weekStats.totalMinutes % 60;
        return (
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {totalHours > 0 ? `${totalHours}h ${remainingMins}m` : `${weekStats.totalMinutes}m`}
              </div>
              <div className="text-sm text-neutral-500">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-neutral-600">
                {weekStats.totalSessions > 0 
                  ? Math.round(weekStats.totalMinutes / weekStats.totalSessions)
                  : 0}m
              </div>
              <div className="text-sm text-neutral-500">Avg Session</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-neutral-600">
                {Math.round(weekStats.totalMinutes / 7)}m
              </div>
              <div className="text-sm text-neutral-500">Per Day</div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6 mb-6 animate-pulse">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-neutral-200 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-neutral-200 rounded w-48" />
            <div className="h-4 bg-neutral-200 rounded w-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
      <div className="flex items-start gap-6">
        {/* Traffic Light Indicator */}
        <div
          className={`w-24 h-24 ${statusConfig.color} rounded-2xl flex flex-col items-center justify-center text-white shrink-0`}
        >
          <FontAwesomeIcon icon={statusConfig.icon} className="text-3xl mb-1" />
          <span className="text-xs font-medium text-center px-2">
            {statusConfig.label}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-neutral-700">
                Revision Coverage
              </h2>
              <p className="text-neutral-500 text-sm">{statusConfig.description}</p>
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
              {[
                { key: "sessions" as ViewTab, icon: faCalendarCheck, label: "Sessions" },
                { key: "coverage" as ViewTab, icon: faLayerGroup, label: "Coverage" },
                { key: "time" as ViewTab, icon: faClock, label: "Time" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 text-sm rounded-md transition flex items-center gap-1.5 ${
                    activeTab === tab.key
                      ? "bg-white shadow-sm text-primary-600 font-medium"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  <FontAwesomeIcon icon={tab.icon} className="text-xs" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}