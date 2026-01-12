// src/components/parentOnboarding/steps/SubjectPriorityGradesStep.tsx

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ============================
   Types
============================ */

export interface SubjectWithGrades {
  subject_id: string;
  subject_name: string;
  exam_board_id?: string;
  exam_board_name: string;
  exam_type_id?: string;
  exam_type_name?: string;
  sort_order: number;
  current_grade: number | null;
  target_grade: number | null;
  grade_confidence: "confirmed" | "estimated" | "unknown";
}

interface SubjectPriorityGradesStepProps {
  subjects: SubjectWithGrades[];
  onSubjectsChange: (subjects: SubjectWithGrades[]) => void;
  onNext: () => void;
  onBack: () => void;
}

/* ============================
   Constants
============================ */

const GRADE_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Not sure" },
  { value: 9, label: "9" },
  { value: 8, label: "8" },
  { value: 7, label: "7" },
  { value: 6, label: "6" },
  { value: 5, label: "5" },
  { value: 4, label: "4" },
  { value: 3, label: "3" },
  { value: 2, label: "2" },
  { value: 1, label: "1" },
];

const TARGET_GRADE_OPTIONS = GRADE_OPTIONS.filter((g) => g.value !== null);

/* ============================
   Sortable Card Component
============================ */

interface SortableCardProps {
  subject: SubjectWithGrades;
  index: number;
  onGradeChange: (field: "current_grade" | "target_grade", value: number | null) => void;
}

function SortableCard({ subject, index, onGradeChange }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subject.subject_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const gradeGap =
    subject.current_grade !== null && subject.target_grade !== null
      ? subject.target_grade - subject.current_grade
      : 0;

  const hasLargeGap = gradeGap >= 3;

  // Build subtitle: "GCSE · Mathematics · AQA"
  const subtitleParts = [
    subject.exam_type_name,
    subject.subject_name,
    subject.exam_board_name,
  ].filter(Boolean);
  const subtitle = subtitleParts.join(" · ");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border-2 rounded-xl p-5 transition-all ${
        isDragging
          ? "border-primary-400 shadow-lg ring-2 ring-primary-200 rotate-1 z-50"
          : "border-neutral-200 hover:border-primary-300 hover:shadow-soft"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Priority Badge */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #744FFF 0%, #5B2CFF 100%)" }}
        >
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-neutral-900 truncate">
                {subject.subject_name}
              </h3>
              <p className="text-sm text-neutral-500 truncate">{subtitle}</p>
            </div>

            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab touch-none p-2 text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0"
              aria-label="Drag to reorder"
            >
              <i className="fa-solid fa-grip-vertical" />
            </button>
          </div>

          {/* Grade selectors */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current Grade */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-2">
                Current grade
              </label>
              <select
                value={subject.current_grade ?? ""}
                onChange={(e) => {
                  const val = e.target.value === "" ? null : parseInt(e.target.value, 10);
                  onGradeChange("current_grade", val);
                }}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
              >
                {GRADE_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.value ?? ""}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Grade */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-2">
                Target grade
              </label>
              <select
                value={subject.target_grade ?? ""}
                onChange={(e) => {
                  const val = e.target.value === "" ? null : parseInt(e.target.value, 10);
                  onGradeChange("target_grade", val);
                }}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
              >
                <option value="">Select target</option>
                {TARGET_GRADE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value ?? ""}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Large Gap Warning */}
          {hasLargeGap && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent-amber/10 border border-accent-amber/30 p-3">
              <i className="fa-solid fa-triangle-exclamation text-accent-amber mt-0.5" />
              <div className="text-sm text-neutral-700">
                <strong>Ambitious target!</strong> A {gradeGap}-grade improvement will need
                significant focus. We'll allocate more sessions to this subject.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================
   Main Component
============================ */

export default function SubjectPriorityGradesStep({
  subjects,
  onSubjectsChange,
  onNext,
  onBack,
}: SubjectPriorityGradesStepProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = subjects.findIndex((s) => s.subject_id === active.id);
        const newIndex = subjects.findIndex((s) => s.subject_id === over.id);

        const reordered = arrayMove(subjects, oldIndex, newIndex).map((s, idx) => ({
          ...s,
          sort_order: idx + 1,
        }));

        onSubjectsChange(reordered);
      }
    },
    [subjects, onSubjectsChange]
  );

  const handleGradeChange = useCallback(
    (subjectId: string, field: "current_grade" | "target_grade", value: number | null) => {
      const updated = subjects.map((s) => {
        if (s.subject_id !== subjectId) return s;

        const newSubject = { ...s, [field]: value };

        if (field === "current_grade") {
          newSubject.grade_confidence = value === null ? "unknown" : "confirmed";
        }

        return newSubject;
      });

      onSubjectsChange(updated);
    },
    [subjects, onSubjectsChange]
  );

  // Validation: all subjects must have target grade
  const isValid = subjects.every((s) => s.target_grade !== null);
  const incompleteCount = subjects.filter((s) => s.target_grade === null).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          Prioritise subjects
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Tell us where the biggest gaps are so we can focus the plan.
        </p>
      </div>

      {/* Tip Box */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-lightbulb text-white text-xs" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary-900 mb-1">How to prioritise</h3>
            <p className="text-xs text-primary-700 leading-relaxed">
              Focus on subjects with the largest grade gaps or where your child needs the most
              support. Drag to reorder — highest priority at the top.
            </p>
          </div>
        </div>
      </div>

      {/* Sortable List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={subjects.map((s) => s.subject_id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4 mb-6">
            {subjects.map((subject, index) => (
              <SortableCard
                key={subject.subject_id}
                subject={subject}
                index={index}
                onGradeChange={(field, value) =>
                  handleGradeChange(subject.subject_id, field, value)
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Validation Message */}
      {!isValid && (
        <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-circle-info text-neutral-500 mt-0.5" />
            <p className="text-sm text-neutral-600">
              Please set a target grade for{" "}
              {incompleteCount === 1
                ? "the remaining subject"
                : `all ${incompleteCount} remaining subjects`}
              .
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-full font-medium text-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition-all"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className="px-8 py-3 rounded-full font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}