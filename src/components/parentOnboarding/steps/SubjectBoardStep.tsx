import { useEffect, useMemo, useState } from "react";
import {
  rpcListExamTypes,
  rpcListSubjectGroupsForExamTypes,
  type ExamTypeRow,
  type SubjectGroupRow,
} from "../../../services/parentOnboarding/parentOnboardingService";

type Props = {
  examTypeIds: string[];
  selectedSubjectIds: string[];
  onChangeSelectedSubjectIds: (ids: string[]) => void;
  onBackToExamTypes: () => void;
  onDone: () => void;
};

type SelectedEntry = {
  exam_type_id: string;
  subject_name: string;
  subject_id: string; // subject row id (tied to exam_board_id)
  exam_board_name: string;
};

function uniqStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const s = v ? String(v) : "";
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function keyFor(examTypeId: string, subjectName: string) {
  return `${examTypeId}::${subjectName}`.toLowerCase();
}

export default function SubjectBoardStep(props: Props) {
  const examTypeIds = useMemo(() => uniqStrings(props.examTypeIds), [props.examTypeIds]);
  const selectedSubjectIds = useMemo(() => uniqStrings(props.selectedSubjectIds), [props.selectedSubjectIds]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [examTypes, setExamTypes] = useState<ExamTypeRow[]>([]);
  const [allGroups, setAllGroups] = useState<SubjectGroupRow[]>([]);

  // which exam type we’re currently selecting subjects for (supports GCSE then IGCSE etc)
  const [activeExamTypeIndex, setActiveExamTypeIndex] = useState(0);

  // modal state
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);

  // ---------------------------
  // Load metadata (exam types)
  // ---------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const rows = await rpcListExamTypes();
        if (cancelled) return;
        setExamTypes(rows);
      } catch (e: any) {
        if (cancelled) return;
        // non-fatal; we can still show the UI without labels
        console.warn("[SubjectBoardStep] rpcListExamTypes failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const examTypeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of examTypes) map.set(r.id, r.name);
    return map;
  }, [examTypes]);

  // ---------------------------
  // Load grouped subjects
  // ---------------------------
  useEffect(() => {
    let cancelled = false;

    // reset view when the chosen exam types change
    setActiveExamTypeIndex(0);
    setOpenGroupKey(null);
    setError(null);

    if (examTypeIds.length === 0) {
      setAllGroups([]);
      return;
    }

    setLoading(true);

    (async () => {
      try {
        const rows = await rpcListSubjectGroupsForExamTypes(examTypeIds);
        if (cancelled) return;

        // Extra safety: enforce “one card per (exam_type_id + subject_name)”
        const map = new Map<string, SubjectGroupRow>();
        for (const g of rows) {
          const k = keyFor(g.exam_type_id, g.subject_name);

          // Boards can be duplicated by seed/data, de-dupe here too
          const seenBoards = new Set<string>();
          const boards = (Array.isArray(g.boards) ? g.boards : [])
            .filter((b) => b?.exam_board_id && b?.exam_board_name && b?.subject_id)
            .filter((b) => {
              const id = String(b.exam_board_id);
              if (seenBoards.has(id)) return false;
              seenBoards.add(id);
              return true;
            })
            .map((b) => ({
              subject_id: String(b.subject_id),
              exam_board_id: String(b.exam_board_id),
              exam_board_name: String(b.exam_board_name),
            }));

          const clean: SubjectGroupRow = {
            exam_type_id: String(g.exam_type_id),
            subject_code: String((g as any).subject_code ?? ""), // might not exist now, keep harmless
            subject_name: String(g.subject_name),
            icon: g.icon ?? null,
            color: g.color ?? null,
            boards,
          };

          if (!map.has(k)) {
            map.set(k, clean);
          } else {
            // merge boards if duplicates exist
            const existing = map.get(k)!;
            const mergedSeen = new Set(existing.boards.map((b) => b.exam_board_id));
            for (const b of clean.boards) {
              if (mergedSeen.has(b.exam_board_id)) continue;
              mergedSeen.add(b.exam_board_id);
              existing.boards.push(b);
            }
          }
        }

        setAllGroups(Array.from(map.values()));
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load subjects");
        setAllGroups([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [examTypeIds.join("|")]); // safe: examTypeIds is always a string[]

  const activeExamTypeId = examTypeIds[activeExamTypeIndex] ?? "";
  const activeExamTypeName = examTypeNameById.get(activeExamTypeId) ?? "Exam";

  const activeGroups = useMemo(() => {
    if (!activeExamTypeId) return [];
    return allGroups
      .filter((g) => String(g.exam_type_id) === String(activeExamTypeId))
      .sort((a, b) => a.subject_name.localeCompare(b.subject_name));
  }, [allGroups, activeExamTypeId]);

  // subject_id -> board name lookup (for lozenges)
  const boardNameBySubjectId = useMemo(() => {
    const map = new Map<string, { exam_board_name: string; exam_type_id: string; subject_name: string }>();
    for (const g of allGroups) {
      for (const b of g.boards) {
        map.set(String(b.subject_id), {
          exam_board_name: String(b.exam_board_name),
          exam_type_id: String(g.exam_type_id),
          subject_name: String(g.subject_name),
        });
      }
    }
    return map;
  }, [allGroups]);

  const selectedEntries: SelectedEntry[] = useMemo(() => {
    return selectedSubjectIds
      .map((id) => {
        const info = boardNameBySubjectId.get(id);
        if (!info) return null;
        return {
          subject_id: id,
          exam_board_name: info.exam_board_name,
          exam_type_id: info.exam_type_id,
          subject_name: info.subject_name,
        };
      })
      .filter(Boolean) as SelectedEntry[];
  }, [selectedSubjectIds, boardNameBySubjectId]);

  // for each (exam_type + subject_name) keep the current selected subject_id
  const selectedByGroupKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of selectedEntries) {
      map.set(keyFor(e.exam_type_id, e.subject_name), e.subject_id);
    }
    return map;
  }, [selectedEntries]);

  function removeSelectionForGroup(examTypeId: string, subjectName: string) {
    const k = keyFor(examTypeId, subjectName);
    const existingSubjectId = selectedByGroupKey.get(k);
    if (!existingSubjectId) return;

    props.onChangeSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== existingSubjectId));
  }

  function setSelectionForGroup(examTypeId: string, subjectName: string, subjectId: string) {
    const k = keyFor(examTypeId, subjectName);
    const existingSubjectId = selectedByGroupKey.get(k);

    const next = new Set(selectedSubjectIds);
    if (existingSubjectId) next.delete(existingSubjectId);
    next.add(subjectId);

    props.onChangeSelectedSubjectIds(Array.from(next));
  }

  const canContinueThisExamType = useMemo(() => {
    if (!activeExamTypeId) return false;
    // At least one selection for this exam type
    return selectedEntries.some((e) => e.exam_type_id === activeExamTypeId);
  }, [selectedEntries, activeExamTypeId]);

  const isLastExamType = activeExamTypeIndex >= examTypeIds.length - 1;

  // ---------------------------
  // Render helpers
  // ---------------------------
  const openGroup = useMemo(() => {
    if (!openGroupKey) return null;
    return activeGroups.find((g) => keyFor(g.exam_type_id, g.subject_name) === openGroupKey) ?? null;
  }, [openGroupKey, activeGroups]);

  const lozenges = useMemo(() => {
    return selectedEntries
      .slice()
      .sort((a, b) => {
        const aType = (examTypeNameById.get(a.exam_type_id) ?? "").localeCompare(examTypeNameById.get(b.exam_type_id) ?? "");
        if (aType !== 0) return aType;
        const aSub = a.subject_name.localeCompare(b.subject_name);
        if (aSub !== 0) return aSub;
        return a.exam_board_name.localeCompare(b.exam_board_name);
      });
  }, [selectedEntries, examTypeNameById]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold">Choose subjects for {activeExamTypeName}</h2>
        <p className="mt-2 text-sm text-gray-600">
          Tap a subject, then pick the exam board. You can change this later.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {/* Search (optional placeholder – keeps your layout) */}
      <div className="mx-auto mb-5 max-w-3xl">
        <div className="flex items-center gap-3 rounded-full border bg-white px-5 py-3 shadow-sm">
          <input
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Search for a subject"
            onChange={() => {
              /* keep simple for now – you can add filtering later */
            }}
          />
          <div className="text-gray-400">⌕</div>
        </div>
      </div>

      {/* Cards */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2">
        {loading ? (
          <div className="col-span-full rounded-xl border bg-white p-4 text-sm text-gray-600">Loading subjects…</div>
        ) : null}

        {!loading && activeGroups.length === 0 ? (
          <div className="col-span-full rounded-xl border bg-white p-4 text-sm text-gray-600">
            No subjects found for {activeExamTypeName}.
          </div>
        ) : null}

        {!loading &&
          activeGroups.map((g) => {
            const k = keyFor(g.exam_type_id, g.subject_name);
            const selectedSubjectId = selectedByGroupKey.get(k);
            const isSelected = !!selectedSubjectId;

            return (
              <button
                key={k}
                type="button"
                className={[
                  "flex items-center justify-between rounded-2xl border bg-white px-5 py-4 text-left shadow-sm transition",
                  isSelected ? "border-blue-300 ring-2 ring-blue-100" : "hover:border-gray-300",
                ].join(" ")}
                onClick={() => setOpenGroupKey(k)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: g.color ?? "#7C3AED" }}
                  >
                    {g.subject_name?.trim()?.[0]?.toUpperCase() ?? "S"}
                  </div>

                  <div>
                    <div className="text-base font-semibold text-gray-900">{g.subject_name}</div>
                    <div className="mt-0.5 text-sm text-gray-600">
                      {isSelected ? "Board selected" : "Tap to choose board"}
                    </div>
                  </div>
                </div>

                <div
                  className={[
                    "h-6 w-6 rounded border",
                    isSelected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white",
                  ].join(" ")}
                >
                  {isSelected ? <div className="flex h-full w-full items-center justify-center text-xs text-white">✓</div> : null}
                </div>
              </button>
            );
          })}

        {/* Modal */}
        {openGroup ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    Choose an exam board for {openGroup.subject_name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    You can always add or change this later.
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-xl border px-4 py-2 text-sm"
                  onClick={() => setOpenGroupKey(null)}
                >
                  Close
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {/* Boards from data */}
                {openGroup.boards.map((b) => (
                  <button
                    key={b.exam_board_id}
                    type="button"
                    className="rounded-full border px-6 py-3 text-sm hover:border-gray-300"
                    onClick={() => {
                      setSelectionForGroup(openGroup.exam_type_id, openGroup.subject_name, b.subject_id);
                      setOpenGroupKey(null);
                    }}
                  >
                    {b.exam_board_name}
                  </button>
                ))}

                {/* Single, deliberate “I’m not sure” option */}
                <button
                  type="button"
                  className="rounded-full border px-6 py-3 text-sm hover:border-gray-300"
                  onClick={() => {
                    // If they’re not sure, we remove the selection for that subject (no phantom subject row).
                    removeSelectionForGroup(openGroup.exam_type_id, openGroup.subject_name);
                    setOpenGroupKey(null);
                  }}
                >
                  I’m not sure
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Lozenges */}
      <div className="mx-auto mt-6 max-w-5xl">
        <div className="text-sm text-gray-700">
          <span className="font-medium">Your subjects:</span>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {lozenges.length === 0 ? (
            <div className="text-sm text-gray-500">None selected yet.</div>
          ) : (
            lozenges.map((e) => {
              const examName = examTypeNameById.get(e.exam_type_id) ?? "Exam";
              return (
                <span
                  key={e.subject_id}
                  className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-800"
                >
                  <span>{examName} • {e.exam_board_name} • {e.subject_name}</span>
                  <button
                    type="button"
                    className="ml-1 rounded-full px-2 text-gray-500 hover:text-gray-800"
                    onClick={() => {
                      props.onChangeSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== e.subject_id));
                    }}
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </span>
              );
            })
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="mx-auto mt-8 flex max-w-5xl items-center justify-between">
        <button
          type="button"
          className="rounded-lg border px-4 py-2 text-sm"
          onClick={() => {
            if (activeExamTypeIndex === 0) props.onBackToExamTypes();
            else setActiveExamTypeIndex((i) => Math.max(0, i - 1));
          }}
        >
          Back
        </button>

        <button
          type="button"
          className="rounded-full bg-blue-600 px-10 py-3 text-sm font-medium text-white disabled:opacity-40"
          disabled={!canContinueThisExamType}
          onClick={() => {
            if (!isLastExamType) {
              setActiveExamTypeIndex((i) => Math.min(examTypeIds.length - 1, i + 1));
              setOpenGroupKey(null);
              setError(null);
              return;
            }
            props.onDone();
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
