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

  // Use weekStats as primary data source, feasibility for overall plan status
  const totalPlanned = weekStats.totalSessions;
  const completed = weekStats.completedSessions;
  const remaining = weekStats.plannedSessions; // Sessions not yet completed
  const totalMinutes = weekStats.totalMinutes;

  // For coverage, use feasibility if available, otherwise derive from weekStats
  const recommended = feasibility?.recommendedSessions || 0;
  const plannedOverall = feasibility?.plannedSessions || totalPlanned;
  const shortfall = feasibility?.shortfall || Math.max(0, recommended - plannedOverall);
  const surplus = feasibility?.surplus || Math.max(0, plannedOverall - recommended);

  // Determine status based on actual data
  const getStatusConfig = () => {
    // If we have no data at all, show unknown
    if (!feasibility && totalPlanned === 0) {
      return {
        color: "bg-neutral-400",
        textColor: "text-neutral-600",
        icon: faExclamationTriangle,
        label: "No Data",
        description: "No sessions scheduled yet",
      };
    }

    // If we have sessions but no feasibility data, show based on what we have
    if (!feasibility) {
      if (totalPlanned > 0) {
        return {
          color: "bg-accent-green",
          textColor: "text-accent-green",
          icon: faCheckCircle,
          label: "Active",
          description: `${totalPlanned} sessions this week`,
        };
      }
      return {
        color: "bg-accent-amber",
        textColor: "text-accent-amber",
        icon: faExclamationTriangle,
        label: "Setup Needed",
        description: "Create a revision plan to get started",
      };
    }

    // Use feasibility status
    switch (feasibility.status) {
      case "good":
        return {
          color: "bg-accent-green",
          textColor: "text-accent-green",
          icon: faCheckCircle,
          label: "Good Coverage",
          description: `${plannedOverall} sessions planned — you're on track!`,
        };
      case "marginal":
        return {
          color: "bg-accent-amber",
          textColor: "text-accent-amber",
          icon: faExclamationTriangle,
          label: "Marginal",
          description: `${plannedOverall} of ${feasibility.withContingency} sessions — consider adding more`,
        };
      case "insufficient":
        return {
          color: "bg-accent-red",
          textColor: "text-accent-red",
          icon: faTimesCircle,
          label: "Needs Attention",
          description: shortfall > 0 
            ? `${shortfall} more sessions needed to meet target`
            : "Review your revision plan",
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
                {totalPlanned}
              </div>
              <div className="text-sm text-neutral-500">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-green">
                {completed}
              </div>
              <div className="text-sm text-neutral-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-neutral-600">
                {remaining}
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
                {recommended > 0 ? recommended : "—"}
              </div>
              <div className="text-sm text-neutral-500">Recommended</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {plannedOverall}
              </div>
              <div className="text-sm text-neutral-500">Planned</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                surplus > 0 ? "text-accent-green" : shortfall > 0 ? "text-accent-red" : "text-neutral-400"
              }`}>
                {surplus > 0 
                  ? `+${surplus}` 
                  : shortfall > 0 
                    ? `-${shortfall}` 
                    : "—"}
              </div>
              <div className="text-sm text-neutral-500">
                {surplus > 0 ? "Surplus" : shortfall > 0 ? "Shortfall" : "Difference"}
              </div>
            </div>
          </div>
        );

      case "time":
        // Calculate time stats from actual data
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const avgSessionMins = totalPlanned > 0 ? Math.round(totalMinutes / totalPlanned) : 0;
        const avgPerDay = Math.round(totalMinutes / 7);
        
        return (
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {totalMinutes === 0 
                  ? "—" 
                  : hours > 0 
                    ? `${hours}h ${mins > 0 ? `${mins}m` : ""}` 
                    : `${totalMinutes}m`}
              </div>
              <div className="text-sm text-neutral-500">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-neutral-600">
                {avgSessionMins > 0 ? `${avgSessionMins}m` : "—"}
              </div>
              <div className="text-sm text-neutral-500">Avg Session</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-neutral-600">
                {avgPerDay > 0 ? `${avgPerDay}m` : "—"}
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