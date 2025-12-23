// src/components/parentOnboarding/steps/SubjectBoardStep.tsx

import { useEffect, useMemo, useState } from "react";
import {
  rpcListSubjectGroupsForExamTypes,
  type SubjectGroupRow,
  type SubjectGroupBoardOption,
} from "../../../services/parentOnboarding/parentOnboardingService";

/**
 * ParentOnboardingPage expects:
 *   value={selectedSubjects}
 *   onChange={setSelectedSubjects}
 */
export type SelectedSubject = {
  subject_id: string; // the selected subject row id (board-specific row)
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

  return { isNotSure, label: isNotSure ? "I’m not sure" : raw };
}

export default function SubjectBoardStep(props: Props) {
  const examTypeIds = Array.isArray(props.examTypeIds) ? props.examTypeIds : [];
  const selected = Array.isArray(props.value) ? props.value : [];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [groups, setGroups] = useState<SubjectGroupRow[]>([]);
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
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const rows = await rpcListSubjectGroupsForExamTypes(ids);
        if (cancelled) return;

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
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [examTypeKey]);

  const activeExamTypeId = examTypeIds[activeExamTypeIndex] ?? null;

  const groupsForActiveExamType = useMemo(() => {
    if (!activeExamTypeId) return [];
    return groups.filter((g) => String(g.exam_type_id) === String(activeExamTypeId));
  }, [groups, activeExamTypeId]);

  // For quick lookup: selected subject by (exam_type_id + subject_name)
  const selectedByGroupKey = useMemo(() => {
    const map = new Map<string, SelectedSubject>();
    for (const s of selected) {
      const key = `${String(s.exam_type_id)}|${String(s.subject_name)}`;
      map.set(key, s);
    }
    return map;
  }, [selected]);

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

  function isGroupSelected(group: SubjectGroupRow): boolean {
    const key = `${String(group.exam_type_id)}|${String(group.subject_name)}`;
    return selectedByGroupKey.has(key);
  }

  function removeSelection(examTypeId: string, subjectName: string) {
    const key = `${String(examTypeId)}|${String(subjectName)}`;
    const next = selected.filter((s) => `${String(s.exam_type_id)}|${String(s.subject_name)}` !== key);
    props.onChange(next);
  }

  function setSelectionForGroup(ctx: BoardPickContext, chosen: SubjectGroupBoardOption) {
    // One choice per (exam_type_id + subject_name)
    const groupKey = `${String(ctx.exam_type_id)}|${String(ctx.subject_name)}`;

    const next: SelectedSubject[] = selected.filter(
      (s) => `${String(s.exam_type_id)}|${String(s.subject_name)}` !== groupKey
    );

    const subject_id = String((chosen as any).subject_id ?? "");
    const exam_board_id = String((chosen as any).exam_board_id ?? "");
    const exam_board_name_raw = String((chosen as any).exam_board_name ?? "");

    if (!subject_id || !exam_board_id || !exam_board_name_raw) {
      // If the backend didn't give us a valid selectable row, don't pretend we selected anything.
      // Just close the modal.
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
    if (examTypeIds.length === 0) return;
    const isLast = activeExamTypeIndex >= examTypeIds.length - 1;
    if (isLast) props.onDone();
    else setActiveExamTypeIndex((i) => Math.min(examTypeIds.length - 1, i + 1));
  }

  function onBack() {
    if (activeExamTypeIndex === 0) props.onBackToExamTypes();
    else setActiveExamTypeIndex((i) => Math.max(0, i - 1));
  }

  // Simple label placeholder (wire in your exam type name map later)
  function examTypeLabel(_examTypeId: string) {
    return "Exam";
  }

  const selectedForActiveExamType = useMemo(() => {
    if (!activeExamTypeId) return [];
    return selected.filter((s) => String(s.exam_type_id) === String(activeExamTypeId));
  }, [selected, activeExamTypeId]);

  return (
    <div className="mt-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Pick your subjects</h2>
          <p className="mt-1 text-sm text-gray-600">Choose a subject, then pick the exam board.</p>
        </div>

        {activeExamTypeId ? (
          <div className="rounded-xl border bg-white px-3 py-2 text-sm">
            <div className="text-xs text-gray-500">Selecting for</div>
            <div className="font-medium">{examTypeLabel(activeExamTypeId)}</div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4">
        {loading ? (
          <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">Loading subjects…</div>
        ) : (
          // Bigger, clearer cards: fewer columns + larger min height
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupsForActiveExamType.map((g) => {
              const selectedFlag = isGroupSelected(g);
              const boardsCount = Array.isArray((g as any).boards) ? (g as any).boards.length : 0;

              return (
                <button
                  key={`${String(g.exam_type_id)}:${String(g.subject_name)}`}
                  type="button"
                  onClick={() => openBoardModal(g)}
                  className={[
                    "rounded-2xl border bg-white text-left shadow-sm transition",
                    "hover:shadow-md",
                    selectedFlag ? "border-black" : "border-gray-200",
                    "p-5",
                    "min-h-[104px]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-lg font-semibold">{String(g.subject_name)}</div>
                      <div className="mt-1 text-sm text-gray-600">{boardsCount} boards</div>
                    </div>

                    {selectedFlag ? (
                      <span className="rounded-full border border-black px-3 py-1 text-xs font-medium">
                        Selected
                      </span>
                    ) : (
                      <span className="rounded-full border px-3 py-1 text-xs text-gray-700">Choose</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="text-sm font-medium">Selected</div>

        <div className="mt-2 flex flex-wrap gap-2">
          {selectedForActiveExamType.length === 0 ? (
            <div className="text-sm text-gray-600">No subjects yet.</div>
          ) : (
            selectedForActiveExamType.map((s) => (
              <div
                key={`${s.exam_type_id}|${s.subject_name}`}
                className="flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-sm"
              >
                <span className="font-medium">{s.subject_name}</span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-700">{s.exam_board_name}</span>

                <button
                  type="button"
                  className="ml-1 rounded-full border px-2 py-0.5 text-xs hover:bg-gray-50"
                  onClick={() => removeSelection(s.exam_type_id, s.subject_name)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={onBack}>
          Back
        </button>

        <button
          type="button"
          className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
          disabled={selectedForActiveExamType.length === 0}
          onClick={onContinue}
        >
          Continue
        </button>
      </div>

      {/* Modal: choose exam board */}
      {modalOpen && modalCtx ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500">Choose exam board</div>
                <div className="text-lg font-semibold">{modalCtx.subject_name}</div>
                <div className="mt-1 text-sm text-gray-600">You can always add it later if you’re not sure.</div>
              </div>

              <button type="button" className="rounded-lg border px-3 py-1 text-sm" onClick={closeModal}>
                Close
              </button>
            </div>

            {(() => {
              const rawBoards = Array.isArray(modalCtx.boards) ? modalCtx.boards : [];

              // Normalise labels + identify not-sure options
              const boards = rawBoards
                .map((b) => {
                  const name = String((b as any).exam_board_name ?? "");
                  const n = normaliseNotSureLabel(name);
                  return { ...b, _label: n.label, _isNotSure: n.isNotSure };
                })
                .filter((b) => (b as any).exam_board_id); // guard against junk rows

              const normalBoards = boards.filter((b) => !(b as any)._isNotSure);
              const notSureBoards = boards.filter((b) => (b as any)._isNotSure);

              // Keep exactly one not-sure option if present in data
              const notSureOne = notSureBoards.slice(0, 1);

              return (
                <div className="mt-4 space-y-2">
                  {normalBoards.map((b: any) => (
                    <button
                      key={String(b.exam_board_id)}
                      type="button"
                      onClick={() => setSelectionForGroup(modalCtx, b)}
                      className="w-full rounded-xl border bg-white px-4 py-3 text-left text-sm hover:bg-gray-50"
                    >
                      <div className="font-medium">{String(b._label)}</div>
                    </button>
                  ))}

                  {notSureOne.map((b: any) => (
                    <button
                      key={`not-sure-${String(b.exam_board_id)}`}
                      type="button"
                      onClick={() => setSelectionForGroup(modalCtx, b)}
                      className="w-full rounded-xl border bg-white px-4 py-3 text-left text-sm hover:bg-gray-50"
                    >
                      <div className="font-medium">I’m not sure</div>
                    </button>
                  ))}

                  {normalBoards.length === 0 && notSureOne.length === 0 ? (
                    <div className="mt-2 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                      No exam boards found for this subject.
                    </div>
                  ) : null}
                </div>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
