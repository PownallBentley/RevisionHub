// src/components/parentOnboarding/steps/SubjectBoardStep.tsx

import { useEffect, useMemo, useState } from "react";
import {
  rpcListSubjectGroupsForExamTypes,
  type SubjectGroupRow,
  type SubjectGroupBoardOption,
} from "../../../services/parentOnboarding/parentOnboardingService";

export type SelectedSubject = {
  subject_id: string;
  exam_type_id?: string;
  subject_name?: string;
  exam_board_id?: string;
  exam_board_name?: string;
};

type BaseProps = {
  examTypeIds: string[];
  onBackToExamTypes: () => void;
  onDone: () => void;
};

type IdModeProps = BaseProps & {
  selectedSubjectIds: string[];
  onChangeSelectedSubjectIds: (ids: string[]) => void;
};

type StructuredModeProps = BaseProps & {
  value: SelectedSubject[];
  onChange: (items: SelectedSubject[]) => void;
};

type Props = IdModeProps | StructuredModeProps;

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

function isIdMode(p: Props): p is IdModeProps {
  return (p as any).onChangeSelectedSubjectIds && (p as any).selectedSubjectIds;
}

export default function SubjectBoardStep(props: Props) {
  const examTypeIds = Array.isArray(props.examTypeIds) ? props.examTypeIds : [];

  // ---- Selection plumbing (supports either prop style) ----
  const selectedSubjectIds: string[] = useMemo(() => {
    if (isIdMode(props)) return Array.isArray(props.selectedSubjectIds) ? props.selectedSubjectIds : [];
    const v = Array.isArray((props as StructuredModeProps).value) ? (props as StructuredModeProps).value : [];
    return v.map((s) => String(s.subject_id)).filter(Boolean);
  }, [props]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [groups, setGroups] = useState<SubjectGroupRow[]>([]);
  const [activeExamTypeIndex, setActiveExamTypeIndex] = useState(0);

  // Search + active picker
  const [query, setQuery] = useState("");
  const [activeCtx, setActiveCtx] = useState<BoardPickContext | null>(null);

  // Stable key to avoid re-fetch loops
  const examTypeKey = useMemo(() => uniq(examTypeIds).slice().sort().join("|"), [examTypeIds]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const ids = uniq(examTypeIds);
      if (ids.length === 0) {
        setGroups([]);
        setActiveExamTypeIndex(0);
        setActiveCtx(null);
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
        setActiveCtx(null);
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

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groupsForActiveExamType;
    return groupsForActiveExamType.filter((g) => String(g.subject_name).toLowerCase().includes(q));
  }, [groupsForActiveExamType, query]);

  // Lookup for subject_id -> display info (used to build SelectedSubject objects if parent wants structured mode)
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
      for (const b of (g as any).boards || []) {
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

  function emitSelection(nextIds: string[]) {
    const ids = uniq(nextIds);

    if (isIdMode(props)) {
      props.onChangeSelectedSubjectIds(ids);
      return;
    }

    // Structured mode: rebuild objects from lookup (best-effort)
    const items: SelectedSubject[] = ids.map((id) => {
      const info = selectedLookup.get(String(id));
      return {
        subject_id: String(id),
        exam_type_id: info?.exam_type_id,
        subject_name: info?.subject_name,
        exam_board_id: info?.exam_board_id,
        exam_board_name: info?.exam_board_name,
      };
    });

    (props as StructuredModeProps).onChange(items);
  }

  function isGroupSelected(group: SubjectGroupRow): boolean {
    const ids = ((group as any).boards || []).map((b: any) => String(b.subject_id));
    return ids.some((id: string) => selectedSubjectIds.includes(id));
  }

  function getSelectedIdForGroup(group: SubjectGroupRow): string | null {
    const ids = ((group as any).boards || []).map((b: any) => String(b.subject_id));
    const found = ids.find((id: string) => selectedSubjectIds.includes(id));
    return found ?? null;
  }

  function openBoardPicker(group: SubjectGroupRow) {
    setActiveCtx({
      exam_type_id: String(group.exam_type_id),
      subject_name: String(group.subject_name),
      icon: (group as any).icon ?? null,
      color: (group as any).color ?? null,
      boards: Array.isArray((group as any).boards) ? (group as any).boards : [],
    });
  }

  function clearActivePicker() {
    setActiveCtx(null);
  }

  function setSelectionForActive(chosen: SubjectGroupBoardOption) {
    if (!activeCtx) return;

    // Rule: one board per (exam_type_id + subject_name)
    const next = new Set(selectedSubjectIds);

    // Remove any previous selection for this subject group
    for (const b of activeCtx.boards || []) {
      if (b?.subject_id) next.delete(String(b.subject_id));
    }

    // Add chosen
    next.add(String(chosen.subject_id));

    emitSelection(Array.from(next));
    clearActivePicker();
  }

  function removeSelection(subjectId: string) {
    emitSelection(selectedSubjectIds.filter((id) => id !== subjectId));
  }

  function onContinue() {
    if (examTypeIds.length === 0) return;

    const isLast = activeExamTypeIndex >= examTypeIds.length - 1;
    if (isLast) props.onDone();
    else {
      setActiveExamTypeIndex((i) => Math.min(examTypeIds.length - 1, i + 1));
      setQuery("");
      setActiveCtx(null);
    }
  }

  function onBack() {
    if (activeExamTypeIndex === 0) props.onBackToExamTypes();
    else {
      setActiveExamTypeIndex((i) => Math.max(0, i - 1));
      setQuery("");
      setActiveCtx(null);
    }
  }

  // TEMP label fallback. If you already have an exam type name map in parent, pass it in later.
  const examTypeLabel = (_examTypeId: string) => "Exam";

  // ---- Rendering helpers ----
  const activeGroupKey = activeCtx ? `${activeCtx.exam_type_id}:${activeCtx.subject_name}` : null;

  return (
    <div className="mt-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Pick your subjects</h2>
          <p className="mt-1 text-sm text-gray-600">Choose a subject, then pick the exam board.</p>
        </div>

        {activeExamTypeId ? (
          <div className="rounded-2xl border bg-white px-3 py-2 text-sm">
            <div className="text-xs text-gray-500">Selecting for</div>
            <div className="font-medium">{examTypeLabel(String(activeExamTypeId))}</div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {/* Search bar */}
      <div className="mt-4">
        <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a subject"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>
        </div>
      </div>

      {/* Subjects list */}
      <div className="mt-4">
        {loading ? (
          <div className="rounded-2xl border bg-white p-4 text-sm text-gray-600 shadow-sm">Loading subjects…</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredGroups.map((g) => {
              const key = `${g.exam_type_id}:${g.subject_name}`;
              const selected = isGroupSelected(g);
              const selectedId = getSelectedIdForGroup(g);
              const selectedInfo = selectedId ? selectedLookup.get(String(selectedId)) : null;
              const isActive = activeGroupKey === key;

              return (
                <div key={key} className="rounded-2xl border bg-white shadow-sm">
                  {/* Row */}
                  <button
                    type="button"
                    onClick={() => openBoardPicker(g)}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-4 text-left hover:bg-gray-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {/* Icon dot (colour if available) */}
                      <div
                        className="h-9 w-9 rounded-full border flex items-center justify-center text-xs font-semibold"
                        style={{
                          backgroundColor: (g as any).color ? String((g as any).color) : undefined,
                          borderColor: (g as any).color ? String((g as any).color) : undefined,
                        }}
                      >
                        {/* If you have real icons later, swap this out */}
                        <span className="text-gray-700">{String(g.subject_name).slice(0, 1).toUpperCase()}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="text-base font-semibold leading-snug">{g.subject_name}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {Array.isArray((g as any).boards) ? (g as any).boards.length : 0} boards
                          {selectedInfo?.exam_board_name ? (
                            <>
                              <span className="mx-2 text-gray-300">•</span>
                              <span className="text-gray-700">{selectedInfo.exam_board_name}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Checkbox feel */}
                    <div className="shrink-0">
                      <div
                        className={[
                          "h-6 w-6 rounded-md border flex items-center justify-center",
                          selected ? "border-black bg-black" : "border-gray-300 bg-white",
                        ].join(" ")}
                      >
                        {selected ? <span className="text-white text-sm leading-none">✓</span> : null}
                      </div>
                    </div>
                  </button>

                  {/* Inline board picker panel (matches your original design behaviour) */}
                  {isActive && activeCtx ? (
                    <div className="border-t px-4 pb-4">
                      <div className="mt-4 rounded-2xl border bg-white p-4">
                        <div className="text-base font-semibold">Choose an exam board for {activeCtx.subject_name}</div>
                        <div className="mt-1 text-sm text-gray-600">
                          You can always add it later if you’re not sure.
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {(activeCtx.boards || []).map((b) => {
                            const isChosen = selectedSubjectIds.includes(String(b.subject_id));
                            return (
                              <button
                                key={String(b.exam_board_id)}
                                type="button"
                                onClick={() => setSelectionForActive(b)}
                                className={[
                                  "rounded-full border px-4 py-2 text-sm",
                                  isChosen ? "border-black bg-black text-white" : "border-gray-200 bg-white hover:bg-gray-50",
                                ].join(" ")}
                              >
                                {b.exam_board_name}
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => clearActivePicker()}
                            className="rounded-full border bg-white px-4 py-2 text-sm hover:bg-gray-50"
                          >
                            I’m not sure
                          </button>

                          {selectedId ? (
                            <button
                              type="button"
                              onClick={() => removeSelection(String(selectedId))}
                              className="rounded-full border bg-white px-4 py-2 text-sm hover:bg-gray-50"
                            >
                              Remove selection
                            </button>
                          ) : null}
                        </div>

                        {(activeCtx.boards || []).length === 0 ? (
                          <div className="mt-4 rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                            No exam boards found for this subject.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected chips (kept, but clearer) */}
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
                <div key={id} className="flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-sm">
                  <span className="text-xs text-gray-500">{examTypeLabel(info.exam_type_id)}</span>
                  <span className="font-medium">{info.subject_name}</span>
                  <span className="text-gray-500">·</span>
                  <span className="text-gray-700">{info.exam_board_name}</span>

                  <button
                    type="button"
                    className="ml-1 rounded-full border px-2 py-0.5 text-xs hover:bg-gray-50"
                    onClick={() => removeSelection(String(id))}
                  >
                    Remove
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Nav */}
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
    </div>
  );
}
