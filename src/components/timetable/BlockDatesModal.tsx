// src/components/timetable/BlockDatesModal.tsx

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faBan,
  faTrash,
  faPlane,
  faGift,
  faCoffee,
  faCalendarTimes,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
  fetchDateOverrides,
  addDateOverride,
  removeDateOverride,
  type DateOverride,
} from "../../services/timetableService";

interface BlockDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  childId: string;
  childName: string;
  onDatesChanged: () => void;
}

const REASON_OPTIONS = [
  { value: "holiday", label: "Holiday", icon: faPlane },
  { value: "event", label: "Event / Birthday", icon: faGift },
  { value: "break", label: "Taking a break", icon: faCoffee },
  { value: "other", label: "Other", icon: faCalendarTimes },
];

export default function BlockDatesModal({
  isOpen,
  onClose,
  childId,
  childName,
  onDatesChanged,
}: BlockDatesModalProps) {
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("holiday");

  useEffect(() => {
    if (isOpen && childId) {
      loadOverrides();
      resetForm();
    }
  }, [isOpen, childId]);

  function resetForm() {
    const today = new Date();
    setStartDate(formatDate(today));
    setEndDate(formatDate(today));
    setReason("holiday");
    setError(null);
  }

  function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  function formatDisplayDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  async function loadOverrides() {
    setLoading(true);
    const { data, error } = await fetchDateOverrides(childId);
    if (data) {
      // Filter to only show blocked dates, sort by date
      const blockedDates = data
        .filter((o) => o.override_type === "blocked")
        .sort((a, b) => a.override_date.localeCompare(b.override_date));
      setOverrides(blockedDates);
    }
    if (error) setError(error);
    setLoading(false);
  }

  async function handleBlockDates() {
    if (!startDate) {
      setError("Please select a start date");
      return;
    }

    setSaving(true);
    setError(null);

    // Generate all dates in range
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;
    const dates: string[] = [];

    const current = new Date(start);
    while (current <= end) {
      dates.push(formatDate(current));
      current.setDate(current.getDate() + 1);
    }

    // Add each date
    let hasError = false;
    for (const date of dates) {
      const { success, error } = await addDateOverride(childId, date, "blocked", reason);
      if (!success) {
        setError(error || "Failed to block some dates");
        hasError = true;
        break;
      }
    }

    setSaving(false);

    if (!hasError) {
      await loadOverrides();
      resetForm();
      onDatesChanged();
    }
  }

  async function handleRemoveDate(date: string) {
    const { success, error } = await removeDateOverride(childId, date);
    if (success) {
      setOverrides((prev) => prev.filter((o) => o.override_date !== date));
      onDatesChanged();
    } else {
      setError(error || "Failed to remove date");
    }
  }

  function getReasonLabel(reasonCode: string | null): string {
    if (!reasonCode) return "Blocked";
    const option = REASON_OPTIONS.find((o) => o.value === reasonCode);
    return option?.label || reasonCode;
  }

  function getReasonIcon(reasonCode: string | null) {
    if (!reasonCode) return faBan;
    const option = REASON_OPTIONS.find((o) => o.value === reasonCode);
    return option?.icon || faBan;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-neutral-700">Block Dates</h2>
            <p className="text-sm text-neutral-500">
              Mark days when {childName} won't be revising
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition"
          >
            <FontAwesomeIcon icon={faTimes} className="text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Add New Block */}
          <div className="bg-neutral-50 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-neutral-700 mb-3">Block New Dates</h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  End Date (optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-neutral-600 mb-2">
                Reason
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REASON_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setReason(option.value)}
                    className={`flex items-center gap-2 px-3 py-2 border-2 rounded-lg text-sm transition ${
                      reason === option.value
                        ? "border-primary-600 bg-primary-50 text-primary-700"
                        : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
                    }`}
                  >
                    <FontAwesomeIcon icon={option.icon} className="text-xs" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleBlockDates}
              disabled={saving || !startDate}
              className="w-full px-4 py-2.5 bg-neutral-700 text-white rounded-lg hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Blocking...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faBan} />
                  Block Date{endDate && startDate !== endDate ? "s" : ""}
                </>
              )}
            </button>
          </div>

          {/* Existing Blocked Dates */}
          <div>
            <h3 className="font-medium text-neutral-700 mb-3">
              Blocked Dates ({overrides.length})
            </h3>

            {loading ? (
              <div className="py-8 text-center">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-neutral-500">Loading...</p>
              </div>
            ) : overrides.length === 0 ? (
              <div className="py-8 text-center text-neutral-500">
                <FontAwesomeIcon icon={faCheck} className="text-2xl text-accent-green mb-2" />
                <p className="text-sm">No dates blocked</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {overrides.map((override) => (
                  <div
                    key={override.id}
                    className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={getReasonIcon(override.reason)}
                          className="text-neutral-500 text-sm"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-700 text-sm">
                          {formatDisplayDate(override.override_date)}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {getReasonLabel(override.reason)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDate(override.override_date)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-neutral-400 hover:text-red-500 transition"
                      title="Remove"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-neutral-200 bg-neutral-50 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}