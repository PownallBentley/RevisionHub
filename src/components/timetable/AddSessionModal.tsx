// src/components/timetable/AddSessionModal.tsx

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faPlus,
  faCalendarAlt,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import {
  fetchChildSubjects,
  addSingleSession,
  type ChildSubjectOption,
} from "../../services/timetableService";

type ModalMode = "choice" | "single" | "recurring";

interface AddSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  childId: string;
  selectedDate?: Date;
  onSessionAdded: () => void;
  onEditSchedule: () => void;
}

export default function AddSessionModal({
  isOpen,
  onClose,
  childId,
  selectedDate,
  onSessionAdded,
  onEditSchedule,
}: AddSessionModalProps) {
  const [mode, setMode] = useState<ModalMode>("choice");
  const [subjects, setSubjects] = useState<ChildSubjectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for single session
  const [formData, setFormData] = useState({
    date: selectedDate ? formatDate(selectedDate) : formatDate(new Date()),
    subjectId: "",
    sessionPattern: "DOUBLE_45",
  });

  useEffect(() => {
    if (isOpen && childId) {
      loadSubjects();
      setMode("choice");
      setError(null);
    }
  }, [isOpen, childId]);

  useEffect(() => {
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        date: formatDate(selectedDate),
      }));
    }
  }, [selectedDate]);

  function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  async function loadSubjects() {
    setLoading(true);
    const { data, error } = await fetchChildSubjects(childId);
    if (data) {
      setSubjects(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, subjectId: data[0].subject_id }));
      }
    }
    if (error) setError(error);
    setLoading(false);
  }

  async function handleAddSession() {
    if (!formData.subjectId || !formData.date) {
      setError("Please select a subject and date");
      return;
    }

    setSaving(true);
    setError(null);

    const durationMap: Record<string, number> = {
      SINGLE_20: 20,
      DOUBLE_45: 45,
      TRIPLE_70: 70,
    };

    const { success, error } = await addSingleSession({
      childId,
      planId: null,
      sessionDate: formData.date,
      subjectId: formData.subjectId,
      sessionPattern: formData.sessionPattern,
      sessionDurationMinutes: durationMap[formData.sessionPattern] || 45,
    });

    setSaving(false);

    if (success) {
      onSessionAdded();
      onClose();
    } else {
      setError(error || "Failed to add session");
    }
  }

  function handleEditSchedule() {
    onClose();
    onEditSchedule();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-700">
            {mode === "choice"
              ? "Add Revision Session"
              : mode === "single"
              ? "Quick Add Session"
              : "Edit Schedule"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition"
          >
            <FontAwesomeIcon icon={faTimes} className="text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Choice Mode */}
          {mode === "choice" && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600 mb-4">
                How would you like to add sessions?
              </p>

              <button
                onClick={() => setMode("single")}
                className="w-full p-4 border-2 border-neutral-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition">
                    <FontAwesomeIcon icon={faPlus} className="text-primary-600 text-lg" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-700">One-time session</h3>
                    <p className="text-sm text-neutral-500">
                      Add a single session for a specific date
                    </p>
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="text-neutral-400 group-hover:text-primary-600 transition" />
                </div>
              </button>

              <button
                onClick={handleEditSchedule}
                className="w-full p-4 border-2 border-neutral-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-primary-600 text-lg" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-700">Change weekly schedule</h3>
                    <p className="text-sm text-neutral-500">
                      Edit recurring availability pattern
                    </p>
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="text-neutral-400 group-hover:text-primary-600 transition" />
                </div>
              </button>
            </div>
          )}

          {/* Single Session Form */}
          {mode === "single" && (
            <div className="space-y-4">
              {loading ? (
                <div className="py-8 text-center">
                  <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">Loading subjects...</p>
                </div>
              ) : (
                <>
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, date: e.target.value }))
                      }
                      min={formatDate(new Date())}
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Subject
                    </label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, subjectId: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {subjects.map((subject) => (
                        <option key={subject.subject_id} value={subject.subject_id}>
                          {subject.subject_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Session Pattern */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Session Length
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "SINGLE_20", label: "20 min", desc: "Quick" },
                        { value: "DOUBLE_45", label: "45 min", desc: "Standard" },
                        { value: "TRIPLE_70", label: "70 min", desc: "Extended" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              sessionPattern: option.value,
                            }))
                          }
                          className={`p-3 border-2 rounded-lg text-center transition ${
                            formData.sessionPattern === option.value
                              ? "border-primary-600 bg-primary-50"
                              : "border-neutral-200 hover:border-neutral-300"
                          }`}
                        >
                          <div className={`font-semibold ${
                            formData.sessionPattern === option.value
                              ? "text-primary-600"
                              : "text-neutral-700"
                          }`}>
                            {option.label}
                          </div>
                          <div className="text-xs text-neutral-500">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === "single" && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-neutral-50">
            <button
              onClick={() => setMode("choice")}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-800 transition"
            >
              Back
            </button>
            <button
              onClick={handleAddSession}
              disabled={saving || loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPlus} />
                  Add Session
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}