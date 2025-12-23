// src/components/parentOnboarding/steps/SubjectBoardStep.tsx

import { useEffect, useMemo, useState } from "react";
import { rpcListExamTypes } from "../../../services/parentOnboarding/parentOnboardingService"; // if you already have this
import {
  rpcListSubjectGroupsForExamTypes,
  type SubjectBoardOption,
  type SubjectGroupRow,
} from "../../../services/parentOnboarding/parentOnboardingService";

type Props = {
  examTypeIds: string[];
  selectedSubjectIds: string[];
  onChangeSelectedSubjectIds: (ids: string[]) => void;

  onBackToExamTypes: () => void;
  onDone: () => void;
};

type ExamTypeRow = { id: string; code: string; name: string; sort_order: number };

type SelectionMeta = {
  subject_id: string;
  exam_type_id: string;
  exam_type_name: string;
  subject_name: string;
  exam_board_id: string | null;
  exam_board_name: string | null;
};

function uniqStrings(arr: string[]) {
  return Array.from(new Set(arr));
}

function makeSubjectKey(examTypeId: string, subjectName: string) {
  return `${examTypeId}::${subjectName}`.toLowerCase();
}

export default function SubjectBoardStep(props: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [examTypes, setExamTypes] = useState<ExamTypeRow[]>([]);
  const [rows, setRows] = useState<SubjectGroupRow[]>([]);

  const orderedExamTypeIds = useMemo(() => uniqStrings(props.examTypeIds), [props.examTypeIds]);

  // Which exam type screen are we on?
  const [activeExamTypeIndex, setActiveExamTypeIndex] = useState(0);

  const activeExamTypeId = orderedExamTypeIds[activeExamTypeIndex] ?? "";
  const activeExamType = useMemo(
    () => examTypes.find((e) => e.id === activeExamTypeId),
    [examTypes, activeExamTypeId]
  );

  // Search
  const [query, setQuery] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubject, setModalSubject] = useState<SubjectGroupRow | null>(null);

  // We keep metadata locally so we can render lozenges cleanly.
  // Source of truth for payload remains: selectedSubjectIds (string[])
  const [selectionMetaBySubjectId, setSelectionMetaBySubjectId] = useState<Record<string, SelectionMeta>>({});

  // Load supporting data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!orderedExamTypeIds.length) return;

      setLoading(true);
      setError(null);
      try {
        // exam types (for breadcrumb labels)
        const examTypeRows = await rpcListExamTypes();
        if (cancelled) return;

        const sorted = [...(examTypeRows as ExamTypeRow[])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setExamTypes(sorted);

        // grouped subjects
        const subjectGroups = await rpcListSubjectGroupsForExamTypes(orderedExamTypeIds);
        if (cancelled) return;

        setRows(subjectGroups);

        // rebuild selection meta from selectedSubjectIds using the newly loaded rows
        const meta: Record<string, SelectionMeta> = {};
        for (const g of subjectGroups) {
          const et = sorted.find((x) => x.id === g.exam_type_id);
          for (const b of g.boards ?? []) {
            if (props.selectedSubjectIds.includes(b.subject_id)) {
              meta[b.subject_id] = {
                subject_id: b.subject_id,
                exam_type_id: g.exam_type_id,
                exam_type_name: et?.name ?? "Exam",
                subject_name: g.subject_name,
                exam_board_id: b.exam_board_id ?? null,
                exam_board_name: b.exam_board_name ?? null,
              };
            }
          }
        }
        setSelectionMetaBySubjectId(meta);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load subjects");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderedExamTypeIds.join("|")]);

  // Rows for active exam type
  const activeSubjects = useMemo(() => {
    const all = rows.filter((r) => r.exam_type_id === activeExamTypeId);
    const q = query.trim().toLowerCase();
    if (!q) return all;

    return all.filter((r) => r.subject_name.toLowerCase().includes(q));
  }, [rows, activeExamTypeId, query]);

  // For a given subject (group), what’s currently selected (if any)?
  const selectedSubjectIdForGroup = (g: SubjectGroupRow): string | null => {
    for (const b of g.boards ?? []) {
      if (props.selectedSubjectIds.includes(b.subject_id)) return b.subject_id;
    }
    return null;
  };

  const selectedBoardNameForGroup = (g: SubjectGroupRow): string | null => {
    const sid = selectedSubjectIdForGroup(g);
    if (!sid) return null;
    const meta = selectionMetaBySubjectId[sid];
    return meta?.exam_board_name ?? null;
  };

  const openBoardModal = (g: SubjectGroupRow) => {
    setModalSubject(g);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalSubject(null);
  };

  // Selecting a board means: ensure only ONE subject_id is selected for that subject_name within this exam type.
  const selectBoard = (g: SubjectGroupRow, option: SubjectBoardOption | null) => {
    const currentlySelectedIds = [...props.selectedSubjectIds];

    // Remove any existing selection for this subject group (across its boards)
    const boardSubjectIds = new Set((g.boards ?? []).map((b) => b.subject_id));
    const nextIds = currentlySelectedIds.filter((id) => !boardSubjectIds.has(id));

    // If they picked a board, add it
    if (option?.subject_id) nextIds.push(option.subject_id);

    props.onChangeSelectedSubjectIds(uniqStrings(nextIds));

    // Update lozenge meta
    const etName = activeExamType?.name ?? "Exam";
    setSelectionMetaBySubjectId((prev) => {
      const copy = { ...prev };

      // clear meta for removed ones
      for (const b of g.boards ?? []) {
        delete copy[b.subject_id];
      }

      // set meta for new one
      if (option?.subject_id) {
        copy[option.subject_id] = {
          subject_id: option.subject_id,
          exam_type_id: g.exam_type_id,
          exam_type_name: etName,
          subject_name: g.subject_name,
          exam_board_id: option.exam_board_id ?? null,
          exam_board_name: option.exam_board_name ?? null,
        };
      } else {
        // "I'm not sure" means we still select one deterministic subject_id? No.
        // It means: user has NOT committed to a board yet, so we keep no subject_id selected.
      }

      return copy;
    });

    closeModal();
  };

  const removeSelection = (subjectId: string) => {
    props.onChangeSelectedSubjectIds(props.selectedSubjectIds.filter((id) => id !== subjectId));
    setSelectionMetaBySubjectId((prev) => {
      const copy = { ...prev };
      delete copy[subjectId];
      return copy;
    });
  };

  // Screen gating: allow continue only if at least 1 subject chosen overall,
  // and for this exam type: allow continue even with zero (if they only picked GCSE and want none, but that’s odd).
  // Practically: require at least 1 overall before leaving the whole step (final exam type).
  const canContinueThisExamType = useMemo(() => {
    // If there are multiple exam types, we let them proceed through screens even if one exam type has 0,
    // but final exit requires at least one overall (ParentOnboarding validates that too).
    return true;
  }, [props.selectedSubjectIds.join("|"), activeExamTypeId]);

  const continueNext = () => {
    // Move to next exam type screen, or finish step
    if (activeExamTypeIndex < orderedExamTypeIds.length - 1) {
      setActiveExamTypeIndex((i) => i + 1);
      setQuery("");
      return;
    }
    props.onDone();
  };

  const back = () => {
    if (activeExamTypeIndex > 0) {
      setActiveExamTypeIndex((i) => i - 1);
      setQuery("");
      return;
    }
    props.onBackToExamTypes();
  };

  // Lozenges (sorted by exam type, then subject name)
  const lozenges = useMemo(() => {
    const metas = Object.values(selectionMetaBySubjectId);
    const bySort = metas.sort((a, b) => {
      const etA = examTypes.find((x) => x.id === a.exam_type_id)?.sort_order ?? 999;
      const etB = examTypes.find((x) => x.id === b.exam_type_id)?.sort_order ?? 999;
      if (etA !== etB) return etA - etB;
      return a.subject_name.localeCompare(b.subject_name);
    });
    return bySort;
  }, [selectionMetaBySubjectId, examTypes]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {activeExamType?.name ? `Choose subjects for ${activeExamType.name}` : "Choose your subjects"}
        </h2>
        <p className="mt-1 text-sm text-gray-600">Tap a subject, then pick the exam board.</p>
      </div>

      <div className="mb-5">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a subject"
            className="w-full rounded-full border bg-white px-5 py-3 pr-12 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">⌕</div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="min-h-[240px]">
        {loading ? (
          <div className="rounded-xl border bg-white p-5 text-sm text-gray-600">Loading subjects…</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {activeSubjects.map((g) => {
              const boardName = selectedBoardNameForGroup(g);
              const selected = !!selectedSubjectIdForGroup(g);

              return (
                <button
                  key={makeSubjectKey(g.exam_type_id, g.subject_name)}
                  type="button"
                  onClick={() => openBoardModal(g)}
                  className={`flex w-full items-center justify-between rounded-2xl border bg-white px-5 py-4 text-left shadow-sm transition
                    ${selected ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: g.color || "#7C3AED" }}
                      aria-hidden
                    >
                      {(g.subject_name?.[0] ?? "S").toUpperCase()}
                    </div>

                    <div>
                      <div className="text-base font-semibold text-gray-900">{g.subject_name}</div>
                      <div className="mt-0.5 text-sm text-gray-600">
                        {boardName ? `Board: ${boardName}` : "Tap to choose board"}
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded border ${selected ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}
                    >
                      {selected ? <div className="h-full w-full text-center text-xs leading-5 text-white">✓</div> : null}
                    </div>
                  </div>
                </button>
              );
            })}

            {!loading && activeSubjects.length === 0 ? (
              <div className="col-span-full rounded-xl border bg-white p-6 text-sm text-gray-600">No subjects found.</div>
            ) : null}
          </div>
        )}
      </div>

      {/* Lozenges */}
      <div className="mt-8">
        <div className="text-sm font-medium text-gray-700">Your subjects:</div>

        <div className="mt-2 flex flex-wrap gap-2">
          {lozenges.length === 0 ? (
            <div className="text-sm text-gray-500">None selected yet.</div>
          ) : (
            lozenges.map((m) => (
              <div
                key={m.subject_id}
                className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-800"
              >
                <span className="font-medium">{m.exam_type_name}</span>
                <span className="text-gray-400">•</span>
                <span>{m.exam_board_name ?? "Board: not set"}</span>
                <span className="text-gray-400">•</span>
                <span>{m.subject_name}</span>
                <button
                  type="button"
                  onClick={() => removeSelection(m.subject_id)}
                  className="ml-1 rounded-full px-2 text-gray-500 hover:bg-gray-200"
                  aria-label={`Remove ${m.subject_name}`}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer buttons (Step 3 owns nav) */}
      <div className="mt-8 flex items-center justify-between">
        <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={back}>
          Back
        </button>

        <button
          type="button"
          className="rounded-full bg-blue-600 px-10 py-3 text-sm font-medium text-white disabled:opacity-40"
          disabled={!canContinueThisExamType}
          onClick={continueNext}
        >
          Continue
        </button>
      </div>

      {/* Modal */}
      {modalOpen && modalSubject ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  Choose an exam board for {modalSubject.subject_name}
                </div>
                <div className="mt-1 text-sm text-gray-600">You can always add or change this later.</div>
              </div>

              <button type="button" className="rounded-xl border px-4 py-2 text-sm" onClick={closeModal}>
                Close
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {(modalSubject.boards ?? []).map((b) => (
                <button
                  key={b.exam_board_id}
                  type="button"
                  onClick={() => selectBoard(modalSubject, b)}
                  className="rounded-full border bg-white px-6 py-3 text-sm shadow-sm hover:border-gray-300"
                >
                  {b.exam_board_name}
                </button>
              ))}

              <button
                type="button"
                onClick={() => selectBoard(modalSubject, null)}
                className="rounded-full border bg-gray-50 px-6 py-3 text-sm shadow-sm hover:border-gray-300"
              >
                I’m not sure
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
