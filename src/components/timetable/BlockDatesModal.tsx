// src/components/timetable/BlockDatesModal.tsx

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faPlus,
  faTrash,
  faPlane,
  faGift,
  faCoffee,
  faCalendarTimes,
  faCheck,
  faExclamationTriangle,
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Track if any dates were added in this session
  const [datesAddedThisSession, setDatesAddedThisSession] = useState(0);
  const initialOverrideCount = useRef<number>(0);

  // Form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("holiday");

  // Auto-update end date when start date changes
  function handleStartDateChange(newStartDate: string) {
    setStartDate(newStartDate);
    // If end date is empty or before start date, set it to start date
    if (!endDate || endDate < newStartDate) {
      setEndDate(newStartDate);
    }
  }

  useEffect(() => {
    if (isOpen && childId) {
      loadOverrides();
      resetForm();
      setDatesAddedThisSession(0);
    }
  }, [isOpen, childId]);

  function resetForm() {
    const today = new Date();
    setStartDate(formatDate(today));
    setEndDate(formatDate(today));
    setReason("holiday");
    setError(null);
    setSuccessMessage(null);
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
      initialOverrideCount.current = blockedDates.length;
    }
    if (error) setError(error);
    setLoading(false);
  }

  async function handleAddBlockedDates() {
    if (!startDate) {
      setError("Please select a start date");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

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
    let addedCount = 0;
    for (const date of dates) {
      const { success, error } = await addDateOverride(childId, date, "blocked", reason);
      if (!success) {
        setError(error || "Failed to block some dates");
        hasError = true;
        break;
      }
      addedCount++;
    }

    setSaving(false);

    if (!hasError) {
      setDatesAddedThisSession((prev) => prev + addedCount);
      setSuccessMessage(`${addedCount} date${addedCount !== 1 ? "s" : ""} added to blocked list`);
      await loadOverrides();
      // Reset form for next entry
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setStartDate(formatDate(tomorrow));
      setEndDate(formatDate(tomorrow));
      onDatesChanged();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
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

  function handleDone() {
    // If no dates were added this session, and there were no blocked dates to begin with
    if (datesAddedThisSession === 0 && initialOverrideCount.current === 0) {
      if (!confirm("You haven't added any blocked dates. Are you sure you want to close?")) {
        return;
      }
    }
    onClose();
  }

  function handleCancel() {
    onClose();
  }

  function getReasonLabel(reasonCode: string | null): string {
    if (!reasonCode) return "Blocked";
    const option = REASON_OPTIONS.find((o) => o.value === reasonCode);
    return option?.label || reasonCode;
  }

  function getReasonIcon(reasonCode: string | null) {
    if (!reasonCode) return faCalendarTimes;
    const option = REASON_OPTIONS.find((o) => o.value === reasonCode);
    return option?.icon || faCalendarTimes;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleCancel} />

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
            onClick={handleCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition"
            title="Cancel"
          >
            <FontAwesomeIcon icon={faTimes} className="text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600 flex items-center gap-2">
              <FontAwesomeIcon icon={faCheck} />
              {successMessage}
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
                  onChange={(e) => handleStartDateChange(e.target.value)}
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
              onClick={handleAddBlockedDates}
              disabled={saving || !startDate}
              className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPlus} />
                  Add to Blocked List
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
              <div className="py-8 text-center text-neutral-500 border-2 border-dashed border-neutral-200 rounded-xl">
                <FontAwesomeIcon icon={faCalendarTimes} className="text-2xl text-neutral-300 mb-2" />
                <p className="text-sm">No dates blocked yet</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Use the form above to add blocked dates
                </p>
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-neutral-50 shrink-0">
          <div className="text-sm text-neutral-500">
            {datesAddedThisSession > 0 && (
              <span className="text-green-600">
                <FontAwesomeIcon icon={faCheck} className="mr-1" />
                {datesAddedThisSession} date{datesAddedThisSession !== 1 ? "s" : ""} added
              </span>
            )}
          </div>
          <button
            onClick={handleDone}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}