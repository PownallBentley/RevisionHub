// src/components/parentOnboarding/steps/SubjectPriorityGradesStep.tsx
// Card sort for subject priority + current/target grade per subject

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface SubjectWithGrades {
  subject_id: string;
  subject_name: string;
  exam_board_name: string;
  sort_order: number;
  current_grade: number | null;
  target_grade: number | null;
  grade_confidence: 'confirmed' | 'estimated' | 'unknown';
}

interface SubjectPriorityGradesStepProps {
  subjects: SubjectWithGrades[];
  onSubjectsChange: (subjects: SubjectWithGrades[]) => void;
  onNext: () => void;
  onBack: () => void;
}

// ============================================================================
// Grade Options
// ============================================================================

const GRADE_OPTIONS = [
  { value: 9, label: '9 (Highest)' },
  { value: 8, label: '8' },
  { value: 7, label: '7' },
  { value: 6, label: '6' },
  { value: 5, label: '5' },
  { value: 4, label: '4' },
  { value: 3, label: '3' },
  { value: 2, label: '2' },
  { value: 1, label: '1 (Lowest)' },
];

// ============================================================================
// Sortable Subject Card Component
// ============================================================================

interface SortableSubjectCardProps {
  subject: SubjectWithGrades;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onGradeChange: (field: 'current_grade' | 'target_grade', value: number | null) => void;
  onConfidenceChange: (confidence: 'confirmed' | 'estimated' | 'unknown') => void;
}

function SortableSubjectCard({
  subject,
  isExpanded,
  onToggleExpand,
  onGradeChange,
  onConfidenceChange,
}: SortableSubjectCardProps) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  const gradeGap = 
    subject.target_grade && subject.current_grade
      ? subject.target_grade - subject.current_grade
      : 0;

  const hasLargeGap = gradeGap >= 4;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg shadow-sm mb-3 ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Header - always visible */}
      <div className="flex items-center p-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 mr-3 text-gray-400 hover:text-gray-600"
        >
          <GripVertical size={20} />
        </div>

        {/* Priority Badge */}
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm mr-3">
          {subject.sort_order}
        </div>

        {/* Subject Info */}
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{subject.subject_name}</h3>
          <p className="text-sm text-gray-500">{subject.exam_board_name}</p>
        </div>

        {/* Grade Summary (when collapsed) */}
        {!isExpanded && (subject.current_grade || subject.target_grade) && (
          <div className="flex items-center gap-2 mr-3 text-sm">
            <span className="text-gray-500">
              {subject.current_grade ?? '?'} → {subject.target_grade ?? '?'}
            </span>
            {hasLargeGap && (
              <AlertTriangle size={16} className="text-amber-500" />
            )}
          </div>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={onToggleExpand}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Expanded Content - Grade Inputs */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t">
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Current Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Grade
              </label>
              <select
                value={subject.current_grade ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'unknown') {
                    onGradeChange('current_grade', 5); // Default to 5
                    onConfidenceChange('unknown');
                  } else if (value === '') {
                    onGradeChange('current_grade', null);
                  } else {
                    onGradeChange('current_grade', parseInt(value, 10));
                    if (subject.grade_confidence === 'unknown') {
                      onConfidenceChange('confirmed');
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select grade...</option>
                {GRADE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
                <option value="unknown">Not sure</option>
              </select>
              {subject.grade_confidence === 'unknown' && (
                <p className="text-xs text-gray-500 mt-1">
                  We'll estimate as grade 5
                </p>
              )}
            </div>

            {/* Target Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Grade
              </label>
              <select
                value={subject.target_grade ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  onGradeChange('target_grade', value ? parseInt(value, 10) : null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select target...</option>
                {GRADE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grade Gap Warning */}
          {hasLargeGap && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Moving from grade {subject.current_grade} to {subject.target_grade} is a big jump ({gradeGap} grades). 
                This will require more revision time for this subject.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function SubjectPriorityGradesStep({
  subjects,
  onSubjectsChange,
  onNext,
  onBack,
}: SubjectPriorityGradesStepProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

        const reordered = arrayMove(subjects, oldIndex, newIndex).map((s, i) => ({
          ...s,
          sort_order: i + 1,
        }));

        onSubjectsChange(reordered);
      }
    },
    [subjects, onSubjectsChange]
  );

  const handleGradeChange = useCallback(
    (subjectId: string, field: 'current_grade' | 'target_grade', value: number | null) => {
      const updated = subjects.map((s) =>
        s.subject_id === subjectId ? { ...s, [field]: value } : s
      );
      onSubjectsChange(updated);
    },
    [subjects, onSubjectsChange]
  );

  const handleConfidenceChange = useCallback(
    (subjectId: string, confidence: 'confirmed' | 'estimated' | 'unknown') => {
      const updated = subjects.map((s) =>
        s.subject_id === subjectId ? { ...s, grade_confidence: confidence } : s
      );
      onSubjectsChange(updated);
    },
    [subjects, onSubjectsChange]
  );

  const toggleExpand = useCallback((subjectId: string) => {
    setExpandedId((prev) => (prev === subjectId ? null : subjectId));
  }, []);

  // Check if we have minimum required data
  const hasRequiredData = subjects.every(
    (s) => s.target_grade !== null
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Prioritise Subjects & Set Targets
        </h2>
        <p className="text-gray-600">
          Drag to reorder by priority (most important first). Then set current and target grades for each subject.
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Higher priority subjects will get more revision sessions. 
          Click on a subject to set grades — this helps us calculate how much revision time you need.
        </p>
      </div>

      {/* Sortable List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={subjects.map((s) => s.subject_id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="mb-6">
            {subjects.map((subject) => (
              <SortableSubjectCard
                key={subject.subject_id}
                subject={subject}
                isExpanded={expandedId === subject.subject_id}
                onToggleExpand={() => toggleExpand(subject.subject_id)}
                onGradeChange={(field, value) =>
                  handleGradeChange(subject.subject_id, field, value)
                }
                onConfidenceChange={(confidence) =>
                  handleConfidenceChange(subject.subject_id, confidence)
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Validation Message */}
      {!hasRequiredData && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Please set a target grade for each subject to continue.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!hasRequiredData}
          className={`px-6 py-2 rounded-lg font-medium ${
            hasRequiredData
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}