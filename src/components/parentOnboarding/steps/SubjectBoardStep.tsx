// src/components/parentOnboarding/steps/SubjectBoardStep.tsx

import { useEffect, useMemo, useState } from "react";
import {
  rpcListSubjectGroupsForExamTypes,
  type SubjectGroupRow,
  type SubjectGroupBoardOption,
} from "../../../services/parentOnboarding/parentOnboardingService";

type Props = {
  examTypeIds: string[];
  selectedSubjectIds: string[];
  onChangeSelectedSubjectIds: (ids: string[]) => void; // ✅ matches ParentOnboardingPage

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
  return Array.from(new Set(ids.filter(Boolean)));
}

export default function SubjectBoardStep(props: Props) {
  // Defensive normalisation (prevents join() / map() on undefined)
  const examTypeIds = Array.isArray(props.examTypeIds) ? props.examTypeIds : [];
  const selectedSubjectIds = Array.isArray(props.selectedSubjectIds) ? props.selectedSubjectIds : [];

  // Hard guard, but not crashing the whole app with a generic stacktrace
  if (typeof props.onChangeSelectedSubjectIds !== "function") {
    throw new Error(
      "SubjectBoardStep: onChangeSelectedSubjectIds prop is missing or not a function (check ParentOnboardingPage prop name)"
    );
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [groups, setGroups] = useState<SubjectGroupRow[]>([]);
  const [activeExamTypeIndex, setActiveExamTypeIndex] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCtx, setModalCtx] = useState<BoardPickContext | null>(null);

  // Stable key to avoid re-fetch loops
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
          boards: Array.isArray(r.boards) ? r.boards : [],
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
  }, [examTypeKey]); // ✅ only changes when exam types truly change

  const activeExamTypeId = examTypeIds[activeExamTypeIndex] ?? null;

  const groupsForActiveExamType = useMemo(() => {
    if (!activeExamTypeId) return [];
    return groups.filter((g) => g.exam_type_id === activeExamTypeId);
  }, [groups, activeExamTypeId]);

  // Lookup for selected lozenges
  const selectedLookup = useMemo(() => {
    const map = new Map<
      string,
      {
        exam_type_id: string;
        subject_name: string;
        exam_board_name: string;
        exam_board_id: string;
      }
    >();

    for (const g of groups) {
      for (const b of g.boards || []) {
        if (!b?.subject_id) continue;
        map.set(String(b.subject_id), {
          exam_type_id: String(g.exam_type_id),
          subject_name: String(g.subject_name),
          exam_board_name: String(b.exam_board_name),
          exam_board_id: String(b.exam_board_id),
        });
      }
    }

    return map;
  }, [groups]);

  // TEMP label fallback (wire to rpc_list_exam_types later if you want)
  const examTypeLabel = (_examTypeId: string) => {
    // If you have exam type map available in parent, pass it in later.
    return "Exam";
  };

  function openBoardModal(group: SubjectGroupRow) {
    setModalCtx({
      exam_type_id: group.exam_type_id,
      subject_name: group.subject_name,
      icon: group.icon ?? null,
      color: group.color ?? null,
      boards: Array.isArray(group.boards) ? group.boards : [],
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalCtx(null);
  }

  function setSelectionForGroup(ctx: BoardPickContext, chosen: SubjectGroupBoardOption) {
    // Rule: one board per (exam_type_id + subject_name)
    const next = new Set(selectedSubjectIds);

    // Remove any previous selection for this subject group
    for (const b of ctx.boards) {
      if (b?.subject_id) next.delete(String(b.subject_id));
    }

    // Add the chosen subject row id
    next.add(String(chosen.subject_id));

    props.onChangeSelectedSubjectIds(Array.from(next));
    closeModal();
  }

  function removeSelection(subjectId: string) {
    props.onChangeSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== subjectId));
  }

  function isGroupSelected(group: SubjectGroupRow): boolean {
    const ids = (group.boards || []).map((b) => String(b.subject_id));
    return ids.some((id) => selectedSubjectIds.includes(id));
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

  return (
    <div className="mt-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Pick your subjects</h2>
          <p className="mt-1 text-sm text-gray-600">
            Choose a subject, then pick the exam board.
          </p>
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {groupsForActiveExamType.map((g) => {
              const selected = isGroupSelected(g);
              return (
                <button
                  key={`${g.exam_type_id}:${g.subject_name}`}
                  type="button"
                  onClick={() => openBoardModal(g)}
                  className={[
                    "rounded-2xl border bg-white p-4 text-left shadow-sm transition",
                    "hover:shadow-md",
                    selected ? "border-black" : "border-gray-200",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold">{g.subject_name}</div>
                      <div className="mt-1 text-xs text-gray-500">{(g.boards || []).length} boards</div>
                    </div>
                    {selected ? (
                      <span className="rounded-full border border-black px-2 py-1 text-xs">Selected</span>
                    ) : (
                      <span className="rounded-full border px-2 py-1 text-xs text-gray-600">Choose</span>
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
          {selectedSubjectIds.length === 0 ? (
            <div className="text-sm text-gray-600">No subjects yet.</div>
          ) : (
            selectedSubjectIds.map((id) => {
              const info = selectedLookup.get(String(id));
              if (!info) return null;

              return (
                <div
                  key={id}
                  className="flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-sm"
                >
                  <span className="text-xs text-gray-500">{examTypeLabel(info.exam_type_id)}</span>
                  <span className="font-medium">{info.subject_name}</span>
                  <span className="text-gray-500">·</span>
                  <span className="text-gray-700">{info.exam_board_name}</span>

                  <button
                    type="button"
                    className="ml-1 rounded-full border px-2 py-0.5 text-xs hover:bg-gray-50"
                    onClick={() => removeSelection(id)}
                  >
                    Remove
                  </button>
                </div>
              );
            })
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
          disabled={selectedSubjectIds.length === 0}
          onClick={onContinue}
        >
          Continue
        </button>
      </div>

      {modalOpen && modalCtx ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500">Choose exam board</div>
                <div className="text-lg font-semibold">{modalCtx.subject_name}</div>
              </div>

              <button type="button" className="rounded-lg border px-3 py-1 text-sm" onClick={closeModal}>
                Close
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {(modalCtx.boards || []).map((b) => (
                <button
                  key={b.exam_board_id}
                  type="button"
                  onClick={() => setSelectionForGroup(modalCtx, b)}
                  className="w-full rounded-xl border bg-white px-4 py-3 text-left text-sm hover:bg-gray-50"
                >
                  <div className="font-medium">{b.exam_board_name}</div>
                </button>
              ))}
            </div>

            {(modalCtx.boards || []).length === 0 ? (
              <div className="mt-4 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                No exam boards found for this subject.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
