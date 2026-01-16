// src/components/subjects/AddSubjectModal.tsx
// Modal for adding subjects to an existing child
// Reuses onboarding step components with simplified flow

import { useState, useEffect, useMemo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faCheck,
  faSpinner,
  faBook,
  faPlus,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

import {
  addSubjectsToChild,
  getChildExamTypes,
  getAllExamTypes,
  type SubjectToAdd,
  type PathwaySelection,
  type ChildExamType,
} from "../../services/addSubjectService";

// Import existing step components
import ExamTypeStep from "../parentOnboarding/steps/ExamTypeStep";
import SubjectBoardStep, {
  type SelectedSubject,
} from "../parentOnboarding/steps/SubjectBoardStep";
import PathwaySelectionStep, {
  type PathwaySelectionData,
} from "../parentOnboarding/steps/PathwaySelectionStep";
import SubjectPriorityGradesStep, {
  type SubjectWithGrades,
} from "../parentOnboarding/steps/SubjectPriorityGradesStep";

interface AddSubjectModalProps {
  childId: string;
  childName: string;
  existingSubjectIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Steps for the Add Subject flow
const STEPS = {
  EXAM_TYPE: 0,
  SUBJECTS: 1,
  PATHWAYS: 2,
  GRADES: 3,
  CONFIRM: 4,
} as const;

const STEP_TITLES: Record<number, string> = {
  [STEPS.EXAM_TYPE]: "Choose exam type",
  [STEPS.SUBJECTS]: "Select subjects",
  [STEPS.PATHWAYS]: "Subject options",
  [STEPS.GRADES]: "Set target grades",
  [STEPS.CONFIRM]: "Confirm & add",
};

export default function AddSubjectModal({
  childId,
  childName,
  existingSubjectIds,
  isOpen,
  onClose,
  onSuccess,
}: AddSubjectModalProps) {
  // Step state
  const [step, setStep] = useState(STEPS.EXAM_TYPE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [childExamTypes, setChildExamTypes] = useState<ChildExamType[]>([]);
  const [allExamTypes, setAllExamTypes] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [selectedExamTypeIds, setSelectedExamTypeIds] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<SelectedSubject[]>([]);
  const [pathwaySelections, setPathwaySelections] = useState<PathwaySelectionData[]>([]);
  const [subjectsWithGrades, setSubjectsWithGrades] = useState<SubjectWithGrades[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);

  // Load initial data
  useEffect(() => {
    if (!isOpen) return;

    async function loadInitialData() {
      setLoadingInit(true);
      setError(null);

      // Get child's current exam types
      const { data: examTypes } = await getChildExamTypes(childId);
      if (examTypes) {
        setChildExamTypes(examTypes);
        // Pre-select child's existing exam types
        setSelectedExamTypeIds(examTypes.map((et) => et.exam_type_id));
      }

      // Get all exam types for selection
      const { data: allTypes } = await getAllExamTypes();
      if (allTypes) {
        setAllExamTypes(allTypes);
      }

      setLoadingInit(false);
    }

    loadInitialData();
  }, [isOpen, childId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(STEPS.EXAM_TYPE);
      setSelectedExamTypeIds([]);
      setSelectedSubjects([]);
      setPathwaySelections([]);
      setSubjectsWithGrades([]);
      setError(null);
    }
  }, [isOpen]);

  // Convert selected subjects to grades format when entering grades step
  useEffect(() => {
    if (step === STEPS.GRADES && selectedSubjects.length > 0 && subjectsWithGrades.length === 0) {
      const converted: SubjectWithGrades[] = selectedSubjects.map((s, index) => ({
        subject_id: s.subject_id,
        subject_name: s.subject_name,
        exam_board_name: s.exam_board_name,
        sort_order: index + 1,
        current_grade: null,
        target_grade: null,
        grade_confidence: "estimated" as const,
      }));
      setSubjectsWithGrades(converted);
    }
  }, [step, selectedSubjects, subjectsWithGrades.length]);

  // Check if any selected subjects require pathways
  const subjectsRequiringPathways = useMemo(() => {
    return selectedSubjects.filter((s) => s.requires_pathway_selection);
  }, [selectedSubjects]);

  const hasPathwayStep = subjectsRequiringPathways.length > 0;

  // Subject IDs for pathway step
  const subjectIdsForPathways = useMemo(() => {
    return selectedSubjects.map((s) => s.subject_id);
  }, [selectedSubjects]);

  // Navigation validation
  const canNext = useMemo(() => {
    switch (step) {
      case STEPS.EXAM_TYPE:
        return selectedExamTypeIds.length > 0;
      case STEPS.SUBJECTS:
        return selectedSubjects.length > 0;
      case STEPS.PATHWAYS:
        return true; // Pathways can be skipped
      case STEPS.GRADES:
        return subjectsWithGrades.length > 0 && 
               subjectsWithGrades.every((s) => s.target_grade !== null);
      default:
        return true;
    }
  }, [step, selectedExamTypeIds, selectedSubjects, subjectsWithGrades]);

  // Handle navigation
  const handleNext = useCallback(() => {
    setError(null);
    
    if (step === STEPS.EXAM_TYPE) {
      setStep(STEPS.SUBJECTS);
    } else if (step === STEPS.SUBJECTS) {
      if (hasPathwayStep) {
        setStep(STEPS.PATHWAYS);
      } else {
        setSubjectsWithGrades([]);
        setStep(STEPS.GRADES);
      }
    } else if (step === STEPS.PATHWAYS) {
      setSubjectsWithGrades([]);
      setStep(STEPS.GRADES);
    } else if (step === STEPS.GRADES) {
      setStep(STEPS.CONFIRM);
    }
  }, [step, hasPathwayStep]);

  const handleBack = useCallback(() => {
    setError(null);
    
    if (step === STEPS.SUBJECTS) {
      setStep(STEPS.EXAM_TYPE);
    } else if (step === STEPS.PATHWAYS) {
      setStep(STEPS.SUBJECTS);
    } else if (step === STEPS.GRADES) {
      if (hasPathwayStep) {
        setStep(STEPS.PATHWAYS);
      } else {
        setStep(STEPS.SUBJECTS);
      }
    } else if (step === STEPS.CONFIRM) {
      setStep(STEPS.GRADES);
    }
  }, [step, hasPathwayStep]);

  // Submit handler
  const handleSubmit = async () => {
    setBusy(true);
    setError(null);

    try {
      const subjects: SubjectToAdd[] = subjectsWithGrades.map((s) => ({
        subject_id: s.subject_id,
        subject_name: s.subject_name,
        exam_board_name: s.exam_board_name,
        current_grade: s.current_grade,
        target_grade: s.target_grade,
        grade_confidence: s.grade_confidence,
      }));

      const pathways: PathwaySelection[] = pathwaySelections
        .filter((p) => p.pathway_id && p.pathway_id !== "skipped")
        .map((p) => ({
          subject_id: p.subject_id,
          pathway_id: p.pathway_id,
        }));

      const result = await addSubjectsToChild(childId, subjects, pathways);

      if (!result.success) {
        setError(result.error || "Failed to add subjects");
        setBusy(false);
        return;
      }

      // Success!
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setBusy(false);
    }
  };

  // Calculate progress
  const totalSteps = hasPathwayStep ? 5 : 4;
  const currentStepDisplay = hasPathwayStep
    ? step + 1
    : step >= STEPS.PATHWAYS
    ? step
    : step + 1;
  const progressPercent = Math.round((currentStepDisplay / totalSteps) * 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-neutral-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-neutral-800">
              {STEP_TITLES[step] || "Add subjects"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="text-neutral-500 text-lg" />
            </button>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-xs font-medium text-neutral-700">
                Step {currentStepDisplay} of {totalSteps}
              </span>
              <span className="text-xs font-medium text-neutral-500">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mx-8 mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex-shrink-0">
            <p className="text-sm font-medium text-red-800">Something went wrong</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="px-8 py-6 flex-1 overflow-y-auto">
          {loadingInit ? (
            <div className="flex items-center justify-center py-12">
              <FontAwesomeIcon icon={faSpinner} className="text-primary-600 text-2xl animate-spin" />
            </div>
          ) : (
            <>
              {/* Step 0: Exam Type Selection */}
              {step === STEPS.EXAM_TYPE && (
                <ExamTypeStep
                  value={selectedExamTypeIds}
                  onChange={(ids) => {
                    setSelectedExamTypeIds(Array.isArray(ids) ? ids : [ids]);
                    setSelectedSubjects([]);
                    setPathwaySelections([]);
                    setSubjectsWithGrades([]);
                  }}
                />
              )}

              {/* Step 1: Subject Selection */}
              {step === STEPS.SUBJECTS && (
                <SubjectBoardStep
                  examTypeIds={selectedExamTypeIds}
                  value={selectedSubjects}
                  onChange={(newSubjects) => {
                    // Filter out already enrolled subjects
                    const filtered = newSubjects.filter(
                      (s) => !existingSubjectIds.includes(s.subject_id)
                    );
                    setSelectedSubjects(filtered);
                    setPathwaySelections([]);
                  }}
                  onBackToExamTypes={() => setStep(STEPS.EXAM_TYPE)}
                  onDone={handleNext}
                />
              )}

              {/* Step 2: Pathway Selection (if needed) */}
              {step === STEPS.PATHWAYS && (
                <PathwaySelectionStep
                  subjectIds={subjectIdsForPathways}
                  value={pathwaySelections}
                  onChange={setPathwaySelections}
                  onBack={handleBack}
                  onNext={handleNext}
                />
              )}

              {/* Step 3: Grades */}
              {step === STEPS.GRADES && (
                <SubjectPriorityGradesStep
                  subjects={subjectsWithGrades}
                  onSubjectsChange={setSubjectsWithGrades}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}

              {/* Step 4: Confirm */}
              {step === STEPS.CONFIRM && (
                <div className="space-y-6">
                  <p className="text-neutral-600">
                    You're about to add {subjectsWithGrades.length} subject
                    {subjectsWithGrades.length !== 1 ? "s" : ""} to {childName}'s revision plan.
                  </p>

                  <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
                    {subjectsWithGrades.map((subject) => (
                      <div
                        key={subject.subject_id}
                        className="flex items-center justify-between bg-white rounded-lg p-3 border border-neutral-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                            <FontAwesomeIcon icon={faBook} className="text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-800">{subject.subject_name}</p>
                            <p className="text-sm text-neutral-500">{subject.exam_board_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-neutral-500">Target:</span>
                            <span className="font-semibold text-primary-600">
                              Grade {subject.target_grade}
                            </span>
                          </div>
                          {subject.current_grade && (
                            <p className="text-xs text-neutral-400">
                              Current: Grade {subject.current_grade}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800">
                      <strong>What happens next:</strong> These subjects will be added to {childName}'s
                      profile and revision sessions will be scheduled based on their current availability.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between flex-shrink-0">
          {step > STEPS.EXAM_TYPE && step !== STEPS.SUBJECTS && step !== STEPS.PATHWAYS && step !== STEPS.GRADES ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={busy}
              className="px-6 py-3 rounded-full font-medium text-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition-colors disabled:opacity-50"
            >
              Back
            </button>
          ) : step === STEPS.EXAM_TYPE ? (
            <div />
          ) : (
            <div />
          )}

          {step === STEPS.EXAM_TYPE && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canNext || busy}
              className="px-8 py-3 rounded-full font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          )}

          {step === STEPS.CONFIRM && (
            <>
              <button
                type="button"
                onClick={handleBack}
                disabled={busy}
                className="px-6 py-3 rounded-full font-medium text-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy}
                className="px-8 py-3 rounded-full font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {busy ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlus} />
                    Add Subject{subjectsWithGrades.length !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
