// src/components/parentOnboarding/steps/SubjectBoardStep.tsx

import { useEffect, useMemo, useState } from "react";
import {
  rpcListSubjectGroupsForExamTypes,
  type SubjectGroupRow,
  type SubjectGroupBoardOption,
} from "../../../services/parentOnboarding/parentOnboardingService";
import { listExamTypes } from "../../../services/referenceData/referenceDataService";

/* ============================
   Types
============================ */

export type SelectedSubject = {
  subject_id: string;
  exam_type_id: string;
  subject_name: string;
  exam_board_id: string;
  exam_board_name: string;
};

type Props = {
  examTypeIds: string[];
  value: SelectedSubject[];
  onChange: (next: SelectedSubject[]) => void;
  onBackToExamTypes: () => void;
  onDone: () => void;
};

type BoardPickContext = {
  exam_type_id: string;
  subject_name: string;
  icon: string | null;
  color: string | null;
  boards: SubjectGroupBoardOption[];
};

type ExamTypeInfo = {
  id: string;
  name: string;
};

/* ============================
   Helpers
============================ */

function uniq(ids: string[]) {
  return Array.from(new Set((ids || []).filter(Boolean).map(String)));
}

function normaliseNotSureLabel(name: string) {
  const raw = (name || "").trim();
  const n = raw.toLowerCase();

  const isNotSure =
    n === "not sure" ||
    n === "not sure yet" ||
    n === "i'm not sure" ||
    n === "im not sure" ||
    n === "i am not sure" ||
    n.includes("not sure");

  return { isNotSure, label: isNotSure ? "I'm not sure" : raw };
}

function formatIcon(dbIcon: string | null): string {
  if (!dbIcon) return "fa-book";
  if (dbIcon.startsWith("fa-")) return dbIcon;
  return `fa-${dbIcon}`;
}

/* ============================
   Main Component
============================ */

export default function SubjectBoardStep(props: Props) {
  const examTypeIds = Array.isArray(props.examTypeIds) ? props.examTypeIds : [];
  const selected = Array.isArray(props.value) ? props.value : [];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [groups, setGroups] = useState<SubjectGroupRow[]>([]);
  const [examTypes, setExamTypes] = useState<ExamTypeInfo[]>([]);
  const [activeExamTypeIndex, setActiveExamTypeIndex] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalCtx, setModalCtx] = useState<BoardPickContext | null>(null);

  const examTypeKey = useMemo(() => uniq(examTypeIds).slice().sort().join("|"), [examTypeIds]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const ids = uniq(examTypeIds);

      if (ids.length === 0) {
        setGroups([]);
        setExamTypes([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [allExamTypes, rows] = await Promise.all([
          listExamTypes(),
          rpcListSubjectGroupsForExamTypes(ids),
        ]);

        if (cancelled) return;

        const selectedExamTypes = ids
          .map((id) => {
            const et = allExamTypes.find((e) => String(e.id) === String(id));
            return et ? { id: String(et.id), name: et.name } : null;
          })
          .filter((et): et is ExamTypeInfo => et !== null);

        setExamTypes(selectedExamTypes);

        const safe = (Array.isArray(rows) ? rows : []).map((r) => ({
          ...r,
          boards: Array.isArray((r as any).boards) ? (r as any).boards : [],
        }));

        setGroups(safe);
        setActiveExamTypeIndex(0);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load subjects");
        setGroups([]);
        setExamTypes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [examTypeKey]);

  const activeExamType = examTypes[activeExamTypeIndex] ?? null;
  const activeExamTypeId = activeExamType?.id ?? null;

  const groupsForActiveExamType = useMemo(() => {
    if (!activeExamTypeId) return [];
    return groups.filter((g) => String(g.exam_type_id) === String(activeExamTypeId));
  }, [groups, activeExamTypeId]);

  const selectedByGroupKey = useMemo(() => {
    const map = new Map<string, SelectedSubject>();
    for (const s of selected) {
      const key = `${String(s.exam_type_id)}|${String(s.subject_name)}`;
      map.set(key, s);
    }
    return map;
  }, [selected]);

  function getGroupKey(group: SubjectGroupRow): string {
    return `${String(group.exam_type_id)}|${String(group.subject_name)}`;
  }

  function isGroupSelected(group: SubjectGroupRow): boolean {
    return selectedByGroupKey.has(getGroupKey(group));
  }

  function handleSubjectClick(group: SubjectGroupRow) {
    const key = getGroupKey(group);

    if (selectedByGroupKey.has(key)) {
      removeSelection(String(group.exam_type_id), String(group.subject_name));
      return;
    }

    openBoardModal(group);
  }

  function openBoardModal(group: SubjectGroupRow) {
    setModalCtx({
      exam_type_id: String(group.exam_type_id),
      subject_name: String(group.subject_name),
      icon: (group as any).icon ?? null,
      color: (group as any).color ?? null,
      boards: Array.isArray((group as any).boards) ? (group as any).boards : [],
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalCtx(null);
  }

  function removeSelection(examTypeId: string, subjectName: string) {
    const key = `${String(examTypeId)}|${String(subjectName)}`;
    const next = selected.filter((s) => `${String(s.exam_type_id)}|${String(s.subject_name)}` !== key);
    props.onChange(next);
  }

  function setSelectionForGroup(ctx: BoardPickContext, chosen: SubjectGroupBoardOption) {
    const groupKey = `${String(ctx.exam_type_id)}|${String(ctx.subject_name)}`;

    const next: SelectedSubject[] = selected.filter(
      (s) => `${String(s.exam_type_id)}|${String(s.subject_name)}` !== groupKey
    );

    const subject_id = String((chosen as any).subject_id ?? "");
    const exam_board_id = String((chosen as any).exam_board_id ?? "");
    const exam_board_name_raw = String((chosen as any).exam_board_name ?? "");

    if (!subject_id || !exam_board_id || !exam_board_name_raw) {
      closeModal();
      return;
    }

    const normalised = normaliseNotSureLabel(exam_board_name_raw);

    next.push({
      subject_id,
      exam_type_id: String(ctx.exam_type_id),
      subject_name: String(ctx.subject_name),
      exam_board_id,
      exam_board_name: normalised.label,
    });

    props.onChange(next);
    closeModal();
  }

  function onContinue() {
    if (examTypes.length === 0) return;
    const isLast = activeExamTypeIndex >= examTypes.length - 1;
    if (isLast) props.onDone();
    else setActiveExamTypeIndex((i) => Math.min(examTypes.length - 1, i + 1));
  }

  function onBack() {
    if (activeExamTypeIndex === 0) props.onBackToExamTypes();
    else setActiveExamTypeIndex((i) => Math.max(0, i - 1));
  }

  const selectedForActiveExamType = useMemo(() => {
    if (!activeExamTypeId) return [];
    return selected.filter((s) => String(s.exam_type_id) === String(activeExamTypeId));
  }, [selected, activeExamTypeId]);

  const allSelectedSubjects = selected;

  return (
    <div>
      {/* Section header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Select subjects
            </h2>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Choose a subject, then pick the exam board. Click again to deselect.
            </p>
          </div>

          {activeExamType && (
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm flex-shrink-0">
              <div className="text-xs text-neutral-500">Selecting for</div>
              <div className="font-semibold text-neutral-900">{activeExamType.name}</div>
            </div>
          )}
        </div>

        {/* Reassurance message */}
        <div className="mt-4 flex items-start gap-3 p-4 bg-primary-50 rounded-xl border border-primary-100">
          <i className="fa-solid fa-circle-info text-primary-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-primary-800">
            Don't worry if you're not sure of all the subjects or exam boards right now — you can always edit or add these later.
          </p>
        </div>
      </div>

      {/* Exam type tabs (if multiple) */}
      {examTypes.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-3">Exam type</label>
          <div className="flex gap-3 flex-wrap">
            {examTypes.map((et, idx) => (
              <button
                key={et.id}
                type="button"
                onClick={() => setActiveExamTypeIndex(idx)}
                className={`px-6 py-3 rounded-xl border-2 font-medium transition-all ${
                  idx === activeExamTypeIndex
                    ? "border-primary-600 bg-primary-50 text-primary-600"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                }`}
              >
                {et.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-6 rounded-xl border border-accent-red/30 bg-accent-red/10 p-4">
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-circle-exclamation text-accent-red mt-0.5" />
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        </div>
      )}

      {/* Subjects grid - 2 columns */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-4">Available subjects</label>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <span className="ml-3 text-sm text-neutral-500">Loading subjects…</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
            {groupsForActiveExamType.map((g) => {
              const selectedFlag = isGroupSelected(g);
              const boardsCount = Array.isArray((g as any).boards) ? (g as any).boards.length : 0;

              const icon = formatIcon((g as any).icon);
              const color = (g as any).color || "#7C3AED";

              return (
                <button
                  key={`${String(g.exam_type_id)}:${String(g.subject_name)}`}
                  type="button"
                  onClick={() => handleSubjectClick(g)}
                  className={`border-2 rounded-xl p-4 text-left transition-all hover:shadow-soft ${
                    selectedFlag
                      ? "border-primary-600 bg-primary-50"
                      : "border-neutral-200 bg-white hover:border-primary-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Icon with database color */}
                      <div
                        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <i
                          className={`fa-solid ${icon}`}
                          style={{ color, fontSize: "1rem" }}
                        />
                      </div>

                      {/* Subject name - slightly smaller text */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-900 leading-tight">
                          {String(g.subject_name)}
                        </div>
                        <div className="mt-1 text-xs text-neutral-500">
                          {boardsCount} {boardsCount === 1 ? "board" : "boards"}
                        </div>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        selectedFlag
                          ? "bg-primary-600 border-primary-600"
                          : "border-neutral-300 bg-white"
                      }`}
                    >
                      {selectedFlag && (
                        <i className="fa-solid fa-check text-white text-[10px]" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected subjects lozenges */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-700 mb-4">
          Selected subjects {allSelectedSubjects.length > 0 && `(${allSelectedSubjects.length})`}
        </label>
        <div className="flex flex-wrap gap-2 p-4 bg-neutral-50 rounded-xl border border-neutral-200 min-h-[72px]">
          {allSelectedSubjects.length === 0 ? (
            <p className="text-sm text-neutral-400">No subjects selected yet.</p>
          ) : (
            allSelectedSubjects.map((s) => {
              const etName = examTypes.find((et) => et.id === s.exam_type_id)?.name ?? "";

              return (
                <div
                  key={`${s.exam_type_id}|${s.subject_name}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
                >
                  <span>
                    {etName && `${etName} · `}{s.subject_name} · {s.exam_board_name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSelection(s.exam_type_id, s.subject_name);
                    }}
                    className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary-200 transition-all"
                    aria-label={`Remove ${s.subject_name}`}
                  >
                    <i className="fa-solid fa-xmark text-[10px]" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

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
          onClick={onContinue}
          disabled={selectedForActiveExamType.length === 0}
          className="px-8 py-3 rounded-full font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>

      {/* Board selection modal */}
      {modalOpen && modalCtx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-card overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-6 border-b border-neutral-200">
              <div>
                <div className="text-sm text-neutral-500">Choose exam board</div>
                <div className="text-lg font-semibold text-neutral-900 mt-1">
                  {modalCtx.subject_name}
                </div>
                <p className="mt-2 text-sm text-neutral-500">
                  You can always change this later if you're not sure.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 transition-all"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
              {(() => {
                const rawBoards = Array.isArray(modalCtx.boards) ? modalCtx.boards : [];

                const boards = rawBoards
                  .map((b) => {
                    const name = String((b as any).exam_board_name ?? "");
                    const n = normaliseNotSureLabel(name);
                    return { ...b, _label: n.label, _isNotSure: n.isNotSure };
                  })
                  .filter((b) => (b as any).exam_board_id);

                const normalBoards = boards.filter((b) => !(b as any)._isNotSure);
                const notSureBoards = boards.filter((b) => (b as any)._isNotSure);
                const notSureOne = notSureBoards.slice(0, 1);

                return (
                  <>
                    {normalBoards.map((b: any) => (
                      <button
                        key={String(b.exam_board_id)}
                        type="button"
                        onClick={() => setSelectionForGroup(modalCtx, b)}
                        className="w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-left hover:border-primary-300 hover:bg-primary-50 transition-all"
                      >
                        <div className="font-medium text-neutral-900">{String(b._label)}</div>
                      </button>
                    ))}

                    {notSureOne.map((b: any) => (
                      <button
                        key={`not-sure-${String(b.exam_board_id)}`}
                        type="button"
                        onClick={() => setSelectionForGroup(modalCtx, b)}
                        className="w-full rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-left hover:border-primary-300 hover:bg-primary-50 transition-all"
                      >
                        <div className="font-medium text-neutral-600">I'm not sure</div>
                      </button>
                    ))}

                    {normalBoards.length === 0 && notSureOne.length === 0 && (
                      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                        No exam boards found for this subject.
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}