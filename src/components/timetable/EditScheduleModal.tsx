// src/components/timetable/EditScheduleModal.tsx
// Modal for editing weekly revision schedule
// Uses shared WeeklyScheduleEditor component

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faCalendarAlt,
  faSave,
  faRotate,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import WeeklyScheduleEditor from "../shared/scheduling/WeeklyScheduleEditor";
import { createEmptyTemplate, type DayTemplate } from "../shared/scheduling/DayCard";
import {
  fetchWeeklyTemplate,
  saveWeeklyTemplate,
  saveTemplateAndRegenerate,
} from "../../services/timetableService";

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  childId: string;
  childName: string;
  onScheduleUpdated: () => void;
}

type SaveMode = "template_only" | "regenerate";

export default function EditScheduleModal({
  isOpen,
  onClose,
  childId,
  childName,
  onScheduleUpdated,
}: EditScheduleModalProps) {
  const [template, setTemplate] = useState<DayTemplate[]>(createEmptyTemplate());
  const [originalTemplate, setOriginalTemplate] = useState<DayTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  // Load template on open
  useEffect(() => {
    if (isOpen && childId) {
      loadTemplate();
    }
  }, [isOpen, childId]);

  async function loadTemplate() {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await fetchWeeklyTemplate(childId);

      if (error) {
        console.error("Error loading template:", error);
        setError(error);
        // Still set a default template so user can create one
        const defaultTemplate = createEmptyTemplate();
        setTemplate(defaultTemplate);
        setOriginalTemplate(JSON.parse(JSON.stringify(defaultTemplate)));
      } else if (data) {
        console.log("Loaded template data:", data);
        setTemplate(data);
        setOriginalTemplate(JSON.parse(JSON.stringify(data)));
      } else {
        // No data returned - use default
        const defaultTemplate = createEmptyTemplate();
        setTemplate(defaultTemplate);
        setOriginalTemplate(JSON.parse(JSON.stringify(defaultTemplate)));
      }
    } catch (err: any) {
      console.error("Exception loading template:", err);
      setError(err.message || "Failed to load schedule");
      const defaultTemplate = createEmptyTemplate();
      setTemplate(defaultTemplate);
      setOriginalTemplate(JSON.parse(JSON.stringify(defaultTemplate)));
    } finally {
      setLoading(false);
    }
  }

  // Check if template has changed
  const hasChanges = JSON.stringify(template) !== JSON.stringify(originalTemplate);

  // Check if valid (at least one session)
  const isValid = template.some((day) => day.is_enabled && day.slots.length > 0);

  // Calculate weekly stats
  const weeklyStats = template.reduce(
    (acc, day) => {
      if (!day.is_enabled) return acc;
      day.slots.forEach((slot) => {
        acc.sessions += 1;
        acc.minutes += slot.session_pattern === "p20" ? 20 : slot.session_pattern === "p70" ? 70 : 45;
      });
      return acc;
    },
    { sessions: 0, minutes: 0 }
  );

  async function handleSave(mode: SaveMode) {
    setSaving(true);
    setError(null);

    try {
      if (mode === "regenerate") {
        const result = await saveTemplateAndRegenerate(childId, template);
        if (result.success) {
          // Log warning if any (non-blocking)
          if (result.warning) {
            console.warn("Schedule save warning:", result.warning);
          }
          // Update original to prevent "unsaved changes" warning
          setOriginalTemplate(JSON.parse(JSON.stringify(template)));
          setShowSaveOptions(false);
          // Call callbacks and close
          onScheduleUpdated();
          onClose();
        } else {
          setError(result.error || "Failed to save schedule");
          setShowSaveOptions(false); // Go back to main view to show error
        }
      } else {
        const result = await saveWeeklyTemplate(childId, template);
        if (result.success) {
          // Update original to prevent "unsaved changes" warning
          setOriginalTemplate(JSON.parse(JSON.stringify(template)));
          setShowSaveOptions(false);
          // Call callbacks and close
          onScheduleUpdated();
          onClose();
        } else {
          setError(result.error || "Failed to save schedule");
          setShowSaveOptions(false); // Go back to main view to show error
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setShowSaveOptions(false); // Go back to main view to show error
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (hasChanges) {
      if (!confirm("You have unsaved changes. Are you sure you want to close?")) {
        return;
      }
    }
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-700">
                Edit Weekly Schedule
              </h2>
              <p className="text-sm text-neutral-500">
                {childName}'s revision timetable
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition"
          >
            <FontAwesomeIcon icon={faTimes} className="text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-neutral-500">Loading schedule...</p>
            </div>
          ) : (
            <WeeklyScheduleEditor
              template={template}
              onChange={setTemplate}
              showSummary={true}
              compact={true}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 shrink-0">
          {/* Show saving state */}
          {saving ? (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-3 text-primary-600">
                <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Saving schedule...</span>
              </div>
            </div>
          ) : showSaveOptions ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600 font-medium">
                How would you like to save?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSave("template_only")}
                  disabled={saving}
                  className="p-3 border-2 border-neutral-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition text-left group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-100 group-hover:bg-primary-100 rounded-lg flex items-center justify-center transition">
                      <FontAwesomeIcon icon={faSave} className="text-neutral-600 group-hover:text-primary-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-700">Save template only</h4>
                      <p className="text-xs text-neutral-500">Existing sessions unchanged</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleSave("regenerate")}
                  disabled={saving}
                  className="p-3 border-2 border-primary-200 bg-primary-50 rounded-xl hover:border-primary-400 hover:bg-primary-100 transition text-left group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 group-hover:bg-primary-200 rounded-lg flex items-center justify-center transition">
                      <FontAwesomeIcon icon={faRotate} className="text-primary-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-primary-700">Save & regenerate</h4>
                      <p className="text-xs text-primary-600">Update future sessions</p>
                    </div>
                  </div>
                </button>
              </div>
              <button
                onClick={() => setShowSaveOptions(false)}
                disabled={saving}
                className="w-full text-sm text-neutral-500 hover:text-neutral-700 py-2 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-500">
                {weeklyStats.sessions} sessions/week · {weeklyStats.minutes} mins/week
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-neutral-600 hover:text-neutral-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSaveOptions(true)}
                  disabled={!isValid || !hasChanges || saving}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faSave} />
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}