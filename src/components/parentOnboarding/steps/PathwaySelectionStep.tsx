// src/components/parentOnboarding/steps/PathwaySelectionStep.tsx
// Onboarding step for selecting exam tiers (Foundation/Higher) and options (RS routes/faiths)

import { useEffect, useState, useMemo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCheck, 
  faChevronRight, 
  faExclamationCircle,
  faQuestionCircle 
} from "@fortawesome/free-solid-svg-icons";
import {
  rpcGetSubjectPathways,
  buildPathwayHierarchy,
  type SubjectPathways,
  type PathwayOption,
} from "../../../services/parentOnboarding/pathwayService";

/* ============================
   Types
============================ */

export type PathwaySelectionData = {
  subject_id: string;
  pathway_id: string;
  pathway_name: string;
};

type Props = {
  /** Subject IDs from the previous step */
  subjectIds: string[];
  /** Current selections */
  value: PathwaySelectionData[];
  /** Update selections */
  onChange: (selections: PathwaySelectionData[]) => void;
  /** Navigate back */
  onBack: () => void;
  /** Navigate forward (called when all required selections made, or skipped) */
  onNext: () => void;
};

/* ============================
   SubjectPathwayCard Component
============================ */

type SubjectCardProps = {
  subject: SubjectPathways;
  selections: PathwaySelectionData[];
  onSelect: (subjectId: string, pathway: PathwayOption) => void;
  onSkip: (subjectId: string) => void;
  onClear: (subjectId: string) => void;
};

function SubjectPathwayCard({ subject, selections, onSelect, onSkip, onClear }: SubjectCardProps) {
  const hierarchy = useMemo(() => buildPathwayHierarchy(subject.pathways), [subject.pathways]);
  
  // Find current selections for this subject
  const subjectSelections = selections.filter(s => s.subject_id === subject.subject_id);
  const selectedIds = subjectSelections.map(s => s.pathway_id);
  
  // Determine what level we're at
  const selectedTopLevel = hierarchy.find(p => selectedIds.includes(p.id));
  const showChildren = selectedTopLevel && selectedTopLevel.children.length > 0;
  const selectedChild = showChildren 
    ? selectedTopLevel.children.find(c => selectedIds.includes(c.id))
    : null;

  // Is this subject complete?
  const isComplete = useMemo(() => {
    if (hierarchy.length === 0) return true;
    if (!selectedTopLevel) return false;
    if (selectedTopLevel.children.length > 0 && !selectedChild) return false;
    return true;
  }, [hierarchy, selectedTopLevel, selectedChild]);

  const isSkipped = subjectSelections.some(s => s.pathway_id === 'skipped');

  return (
    <div className={`rounded-xl border bg-white shadow-sm ${isComplete ? 'border-green-200' : isSkipped ? 'border-amber-200' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isComplete ? 'bg-green-100 text-green-600' : 
            isSkipped ? 'bg-amber-100 text-amber-600' : 
            'bg-gray-100 text-gray-400'
          }`}>
            {isComplete ? (
              <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
            ) : isSkipped ? (
              <FontAwesomeIcon icon={faQuestionCircle} className="w-4 h-4" />
            ) : (
              <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{subject.subject_name}</div>
            {isComplete && selectedTopLevel && (
              <div className="text-sm text-gray-500">
                {selectedTopLevel.pathway_name}
                {selectedChild && ` → ${selectedChild.pathway_name}`}
              </div>
            )}
            {isSkipped && (
              <div className="text-sm text-amber-600">
                Selection needed before revision starts
              </div>
            )}
          </div>
        </div>
        
        {!isComplete && !isSkipped && (
          <button
            type="button"
            onClick={() => onSkip(subject.subject_id)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            I'm not sure
          </button>
        )}
      </div>

      {/* Selection Area */}
      {!isComplete && !isSkipped && (
        <div className="p-4">
          {/* Top-level selection */}
          {!selectedTopLevel && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">
                {hierarchy.length === 2 && hierarchy[0].pathway_code === 'foundation' 
                  ? 'Which tier is your child studying?'
                  : 'Select an option'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {hierarchy.map(pathway => (
                  <button
                    key={pathway.id}
                    type="button"
                    onClick={() => onSelect(subject.subject_id, pathway)}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-left hover:border-gray-300 hover:bg-gray-50 transition"
                  >
                    <div className="font-medium text-gray-900">{pathway.pathway_name}</div>
                    {pathway.pathway_code === 'foundation' && (
                      <div className="text-sm text-gray-500 mt-1">Grades 1-5 available</div>
                    )}
                    {pathway.pathway_code === 'higher' && (
                      <div className="text-sm text-gray-500 mt-1">Grades 4-9 available</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Child-level selection (e.g., RS faith options) */}
          {showChildren && !selectedChild && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-gray-700">
                  Now select the specific option
                </div>
                <button
                  type="button"
                  onClick={() => onClear(subject.subject_id)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Change {selectedTopLevel.pathway_name}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedTopLevel.children.map(child => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => onSelect(subject.subject_id, child)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-left hover:border-gray-300 hover:bg-gray-50 transition"
                  >
                    <div className="font-medium text-gray-900 text-sm">{child.pathway_name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed state - allow changing */}
      {isComplete && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => onClear(subject.subject_id)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Change selection
          </button>
        </div>
      )}

      {/* Skipped state - allow completing */}
      {isSkipped && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => onClear(subject.subject_id)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Select now
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================
   Main Component
============================ */

export default function PathwaySelectionStep({
  subjectIds,
  value,
  onChange,
  onBack,
  onNext,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectsWithPathways, setSubjectsWithPathways] = useState<SubjectPathways[]>([]);

  // Fetch pathway data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (subjectIds.length === 0) {
        setSubjectsWithPathways([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await rpcGetSubjectPathways(subjectIds);
        if (cancelled) return;
        setSubjectsWithPathways(data);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load pathway options");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [subjectIds]);

  // Handle pathway selection
  const handleSelect = useCallback((subjectId: string, pathway: PathwayOption) => {
    const subject = subjectsWithPathways.find(s => s.subject_id === subjectId);
    if (!subject) return;

    // Remove skip marker if present
    let newSelections = value.filter(
      s => !(s.subject_id === subjectId && s.pathway_id === 'skipped')
    );

    // If this is a child pathway, keep the parent selection
    if (pathway.parent_pathway_id) {
      // Keep parent, add child
      newSelections = newSelections.filter(
        s => s.subject_id !== subjectId || s.pathway_id === pathway.parent_pathway_id
      );
    } else {
      // This is a top-level selection - clear any existing selections for this subject
      newSelections = newSelections.filter(s => s.subject_id !== subjectId);
    }

    newSelections.push({
      subject_id: subjectId,
      pathway_id: pathway.id,
      pathway_name: pathway.pathway_name,
    });

    onChange(newSelections);
  }, [value, onChange, subjectsWithPathways]);

  // Handle skip
  const handleSkip = useCallback((subjectId: string) => {
    // Clear any existing selections and add skip marker
    const newSelections = value.filter(s => s.subject_id !== subjectId);
    newSelections.push({
      subject_id: subjectId,
      pathway_id: 'skipped',
      pathway_name: 'Not selected',
    });
    onChange(newSelections);
  }, [value, onChange]);

  // Handle clear (to change selection)
  const handleClear = useCallback((subjectId: string) => {
    onChange(value.filter(s => s.subject_id !== subjectId));
  }, [value, onChange]);

  // Check if all subjects are addressed (either selected or skipped)
  const allAddressed = useMemo(() => {
    for (const subject of subjectsWithPathways) {
      const subjectSelections = value.filter(s => s.subject_id === subject.subject_id);
      if (subjectSelections.length === 0) return false;

      // Check if it's skipped
      if (subjectSelections.some(s => s.pathway_id === 'skipped')) continue;

      // Check if selection is complete (has required depth)
      const hierarchy = buildPathwayHierarchy(subject.pathways);
      const selectedIds = subjectSelections.map(s => s.pathway_id);
      const selectedTopLevel = hierarchy.find(p => selectedIds.includes(p.id));
      
      if (!selectedTopLevel) return false;
      if (selectedTopLevel.children.length > 0) {
        const hasChild = selectedTopLevel.children.some(c => selectedIds.includes(c.id));
        if (!hasChild) return false;
      }
    }
    return true;
  }, [subjectsWithPathways, value]);

  // Count skipped subjects
  const skippedCount = useMemo(() => {
    return value.filter(s => s.pathway_id === 'skipped').length;
  }, [value]);

  // If no subjects require pathway selection, auto-advance
  useEffect(() => {
    if (!loading && subjectsWithPathways.length === 0) {
      onNext();
    }
  }, [loading, subjectsWithPathways.length, onNext]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Checking subject options...</h2>
          <p className="mt-1 text-sm text-gray-600">Loading pathway information</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-100 rounded-xl"></div>
          <div className="h-24 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faExclamationCircle} className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <div className="font-medium text-red-800">Failed to load options</div>
              <div className="text-sm text-red-700 mt-1">{error}</div>
            </div>
          </div>
        </div>
        <div className="flex justify-between">
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
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  if (subjectsWithPathways.length === 0) {
    // Should auto-advance, but just in case
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Select exam tiers and options
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Some subjects have different tiers or options. This helps us show the right content.
        </p>
      </div>

      {/* Info box */}
      <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
        <strong>Not sure?</strong> You can skip for now and set this later. 
        Check your child's exercise books or ask their teacher.
      </div>

      {/* Subject cards */}
      <div className="space-y-4">
        {subjectsWithPathways.map(subject => (
          <SubjectPathwayCard
            key={subject.subject_id}
            subject={subject}
            selections={value}
            onSelect={handleSelect}
            onSkip={handleSkip}
            onClear={handleClear}
          />
        ))}
      </div>

      {/* Skipped warning */}
      {skippedCount > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <FontAwesomeIcon icon={faExclamationCircle} className="w-4 h-4 mr-2" />
          {skippedCount === 1 
            ? "1 subject needs tier/option selection before revision can start."
            : `${skippedCount} subjects need tier/option selection before revision can start.`}
          {" "}You'll see a reminder on your dashboard.
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
          disabled={!allAddressed}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
        >
          {skippedCount > 0 ? 'Continue anyway' : 'Next'}
        </button>
      </div>
    </div>
  );
}