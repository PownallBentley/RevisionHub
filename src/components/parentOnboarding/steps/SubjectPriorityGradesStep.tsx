// src/components/parentOnboarding/steps/SubjectPriorityGradesStep.tsx
// Card sort for subject priority + current/target grade per subject

import { useState, useCallback } from 'react';
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGripVertical, 
  faChevronDown, 
  faChevronUp, 
  faExclamationTriangle 
} from '@fortawesome/free-solid-svg-icons';

/* ============================
   Types
============================ */

export interface SubjectWithGrades {
  subject_id: string;
  subject_name: string;
  exam_board_id?: string;
  exam_board_name: string;
  exam_type_id?: string;
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

/* ============================
   Constants
============================ */

const GRADE_OPTIONS = [
  { value: null, label: 'Not sure' },
  { value: 9, label: '9' },
  { value: 8, label: '8' },
  { value: 7, label: '7' },
  { value: 6, label: '6' },
  { value: 5, label: '5' },
  { value: 4, label: '4' },
  { value: 3, label: '3' },
  { value: 2, label: '2' },
  { value: 1, label: '1' },
];

const TARGET_GRADE_OPTIONS = GRADE_OPTIONS.filter(g => g.value !== null);

/* ============================
   Sortable Card Component
============================ */

interface SortableCardProps {
  subject: SubjectWithGrades;
  isExpanded: boolean;
  onToggle: () => void;
  onGradeChange: (field: 'current_grade' | 'target_grade', value: number | null) => void;
}

function SortableCard({ subject, isExpanded, onToggle, onGradeChange }: SortableCardProps) {
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
    subject.current_grade !== null && subject.target_grade !== null
      ? subject.target_grade - subject.current_grade
      : 0;

  const hasLargeGap = gradeGap >= 4;

  const gradeDisplay = 
    subject.current_grade !== null && subject.target_grade !== null
      ? `${subject.current_grade} → ${subject.target_grade}`
      : subject.target_grade !== null
      ? `? → ${subject.target_grade}`
      : 'Set grades';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        rounded-xl border bg-white shadow-sm
        ${isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''}
        ${hasLargeGap ? 'border-amber-300' : 'border-gray-200'}
      `}
    >
      {/* Card Header */}
      <div className="flex items-center gap-3 p-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none p-1 text-gray-400 hover:text-gray-600"
          aria-label="Drag to reorder"
        >
          <FontAwesomeIcon icon={faGripVertical} className="w-4 h-4" />
        </button>

        {/* Priority Badge */}
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
          {subject.sort_order}
        </div>

        {/* Subject Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">
            {subject.subject_name}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {subject.exam_board_name}
          </div>
        </div>

        {/* Grade Summary (collapsed) */}
        {!isExpanded && (
          <div className={`text-sm font-medium ${hasLargeGap ? 'text-amber-600' : 'text-gray-600'}`}>
            {gradeDisplay}
            {hasLargeGap && (
              <FontAwesomeIcon icon={faExclamationTriangle} className="ml-1 w-4 h-4 text-amber-500" />
            )}
          </div>
        )}

        {/* Expand/Collapse */}
        <button
          onClick={onToggle}
          className="p-2 text-gray-400 hover:text-gray-600"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <FontAwesomeIcon 
            icon={isExpanded ? faChevronUp : faChevronDown} 
            className="w-4 h-4" 
          />
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <div className="grid grid-cols-2 gap-4">
            {/* Current Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current grade
              </label>
              <select
                value={subject.current_grade ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                  onGradeChange('current_grade', val);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {GRADE_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.value ?? ''}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {subject.current_grade === null && (
                <p className="mt-1 text-xs text-gray-500">
                  We'll estimate based on averages
                </p>
              )}
            </div>

            {/* Target Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target grade
              </label>
              <select
                value={subject.target_grade ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                  onGradeChange('target_grade', val);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select target</option>
                {TARGET_GRADE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value ?? ''}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Large Gap Warning */}
          {hasLargeGap && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mt-0.5 w-4 h-4 text-amber-500" />
              <div className="text-sm text-amber-800">
                <strong>Ambitious target!</strong> A {gradeGap}-grade improvement will need 
                significant time. We'll allocate more sessions to this subject.
              </div>
            </div>
          )}
        </div>
      )}
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
  const [expandedId, setExpandedId] = useState<string | null>(
    subjects.length > 0 ? subjects[0].subject_id : null
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = subjects.findIndex(s => s.subject_id === active.id);
      const newIndex = subjects.findIndex(s => s.subject_id === over.id);

      const reordered = arrayMove(subjects, oldIndex, newIndex).map((s, idx) => ({
        ...s,
        sort_order: idx + 1,
      }));

      onSubjectsChange(reordered);
    }
  }, [subjects, onSubjectsChange]);

  const handleGradeChange = useCallback((
    subjectId: string,
    field: 'current_grade' | 'target_grade',
    value: number | null
  ) => {
    const updated = subjects.map(s => {
      if (s.subject_id !== subjectId) return s;

      const newSubject = { ...s, [field]: value };

      // Update grade_confidence based on current grade selection
      if (field === 'current_grade') {
        newSubject.grade_confidence = value === null ? 'unknown' : 'confirmed';
      }

      return newSubject;
    });

    onSubjectsChange(updated);
  }, [subjects, onSubjectsChange]);

  const toggleExpand = useCallback((subjectId: string) => {
    setExpandedId(prev => prev === subjectId ? null : subjectId);
  }, []);

  // Validation: all subjects must have target grade
  const isValid = subjects.every(s => s.target_grade !== null);

  const incompleteCount = subjects.filter(s => s.target_grade === null).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Prioritise subjects and set grades
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Drag to reorder by priority. Set current and target grades to help us 
          recommend the right amount of revision.
        </p>
      </div>

      {/* Instructions */}
      <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
        <strong>Tip:</strong> Put the subject that needs most attention at the top. 
        We'll allocate more sessions to higher-priority subjects.
      </div>

      {/* Sortable List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={subjects.map(s => s.subject_id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {subjects.map(subject => (
              <SortableCard
                key={subject.subject_id}
                subject={subject}
                isExpanded={expandedId === subject.subject_id}
                onToggle={() => toggleExpand(subject.subject_id)}
                onGradeChange={(field, value) => handleGradeChange(subject.subject_id, field, value)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Validation Message */}
      {!isValid && (
        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          Please set a target grade for {incompleteCount === 1 ? 'the remaining subject' : `all ${incompleteCount} remaining subjects`}.
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}