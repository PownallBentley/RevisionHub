// src/components/account/AnalyticsSharingCard.tsx

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faShieldAlt,
  faUsers,
  faCheck,
  faInfoCircle,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

interface ChildSharingOption {
  child_id: string;
  child_name: string;
  enabled: boolean;
}

interface AnalyticsSharingSettings {
  enabled: boolean;
  scope: "town" | "county" | "national";
  children: ChildSharingOption[];
}

interface AnalyticsSharingCardProps {
  settings: AnalyticsSharingSettings;
  onSettingsChange: (settings: AnalyticsSharingSettings) => void;
  saving?: boolean;
}

const SCOPE_OPTIONS = [
  { value: "town", label: "Town/City", description: "Compare with students in your area" },
  { value: "county", label: "County/Region", description: "Compare across your county" },
  { value: "national", label: "National", description: "Compare with all UK students" },
] as const;

export default function AnalyticsSharingCard({
  settings,
  onSettingsChange,
  saving = false,
}: AnalyticsSharingCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleMainToggle = () => {
    onSettingsChange({
      ...settings,
      enabled: !settings.enabled,
    });
  };

  const handleScopeChange = (scope: AnalyticsSharingSettings["scope"]) => {
    onSettingsChange({
      ...settings,
      scope,
    });
  };

  const handleChildToggle = (childId: string) => {
    onSettingsChange({
      ...settings,
      children: settings.children.map((c) =>
        c.child_id === childId ? { ...c, enabled: !c.enabled } : c
      ),
    });
  };

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        backgroundColor: "#FFFFFF",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#F7F4FF" }}
          >
            <FontAwesomeIcon icon={faChartLine} style={{ color: "#5B2CFF" }} className="text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "#1F2330" }}>
              Community Insights Programme
            </h3>
            <p className="text-sm" style={{ color: "#6C7280" }}>
              Share anonymised progress, unlock peer comparisons
            </p>
          </div>
        </div>

        {/* Main toggle */}
        <button
          onClick={handleMainToggle}
          disabled={saving}
          className="relative w-14 h-7 rounded-full transition-colors"
          style={{ backgroundColor: settings.enabled ? "#1EC592" : "#E1E4EE" }}
        >
          <div
            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.enabled ? "translate-x-8" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Value proposition */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ backgroundColor: "#F9FAFC" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faShieldAlt} style={{ color: "#1EC592" }} className="mt-0.5" />
            <div>
              <p className="text-sm font-medium" style={{ color: "#1F2330" }}>
                100% Anonymised
              </p>
              <p className="text-xs" style={{ color: "#6C7280" }}>
                No names or identifiable data shared
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faUsers} style={{ color: "#5B2CFF" }} className="mt-0.5" />
            <div>
              <p className="text-sm font-medium" style={{ color: "#1F2330" }}>
                Peer Insights
              </p>
              <p className="text-xs" style={{ color: "#6C7280" }}>
                See how your child compares
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faChartLine} style={{ color: "#FFB547" }} className="mt-0.5" />
            <div>
              <p className="text-sm font-medium" style={{ color: "#1F2330" }}>
                Better Planning
              </p>
              <p className="text-xs" style={{ color: "#6C7280" }}>
                Informed decisions based on real data
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What's shared info */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 text-sm font-medium mb-4"
        style={{ color: "#5B2CFF" }}
      >
        <FontAwesomeIcon icon={faInfoCircle} />
        What data is shared?
        <FontAwesomeIcon icon={showDetails ? faChevronUp : faChevronDown} className="text-xs" />
      </button>

      {showDetails && (
        <div
          className="rounded-xl p-4 mb-4 border"
          style={{ backgroundColor: "#F7F4FF", borderColor: "#EAE3FF" }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: "#1F2330" }}>
            Data we share (anonymised):
          </p>
          <ul className="text-sm space-y-1" style={{ color: "#6C7280" }}>
            <li className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCheck} style={{ color: "#1EC592" }} className="text-xs" />
              Session completion counts
            </li>
            <li className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCheck} style={{ color: "#1EC592" }} className="text-xs" />
              Topic coverage percentages
            </li>
            <li className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCheck} style={{ color: "#1EC592" }} className="text-xs" />
              Subject progress metrics
            </li>
            <li className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCheck} style={{ color: "#1EC592" }} className="text-xs" />
              Year group & exam board (for grouping)
            </li>
          </ul>
          <p className="text-sm font-medium mt-3 mb-2" style={{ color: "#1F2330" }}>
            Never shared:
          </p>
          <ul className="text-sm space-y-1" style={{ color: "#6C7280" }}>
            <li>❌ Names or personal details</li>
            <li>❌ Specific answers or responses</li>
            <li>❌ School name or exact location</li>
          </ul>
        </div>
      )}

      {/* Settings (shown when enabled) */}
      {settings.enabled && (
        <div className="space-y-4 pt-4 border-t" style={{ borderColor: "#E1E4EE" }}>
          {/* Scope selection */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: "#1F2330" }}>
              Comparison scope
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SCOPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleScopeChange(option.value)}
                  disabled={saving}
                  className={`p-3 rounded-xl border text-center transition-colors ${
                    settings.scope === option.value
                      ? "border-2"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                  style={
                    settings.scope === option.value
                      ? { borderColor: "#5B2CFF", backgroundColor: "#F7F4FF" }
                      : {}
                  }
                >
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: settings.scope === option.value ? "#5B2CFF" : "#1F2330",
                    }}
                  >
                    {option.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#6C7280" }}>
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Per-child toggles (if multiple children) */}
          {settings.children.length > 1 && (
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: "#1F2330" }}>
                Include in programme
              </label>
              <div className="space-y-2">
                {settings.children.map((child) => (
                  <div
                    key={child.child_id}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ backgroundColor: "#F9FAFC" }}
                  >
                    <span className="text-sm" style={{ color: "#1F2330" }}>
                      {child.child_name}
                    </span>
                    <button
                      onClick={() => handleChildToggle(child.child_id)}
                      disabled={saving}
                      className="relative w-10 h-5 rounded-full transition-colors"
                      style={{ backgroundColor: child.enabled ? "#1EC592" : "#E1E4EE" }}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          child.enabled ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Coming soon badge */}
      <div
        className="mt-4 p-3 rounded-xl flex items-center gap-3"
        style={{ backgroundColor: "#FFF7E6", border: "1px solid #FFE4B5" }}
      >
        <span className="text-lg">🚀</span>
        <div>
          <p className="text-sm font-medium" style={{ color: "#B8860B" }}>
            Coming soon
          </p>
          <p className="text-xs" style={{ color: "#DAA520" }}>
            Peer insights dashboard launching Q2 2026
          </p>
        </div>
      </div>
    </div>
  );
}