// src/components/parentOnboarding/steps/SubjectBoardStep.tsx

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type RpcSubjectRow = {
  subject_id: string;
  subject_name: string;
  exam_type_id: string;
  exam_board_id: string;
  exam_board_name: string;
  subject_code: string;
  icon: string;
  color: string;
};

type ExamTypeRow = {
  id: string;
  code: string;
  name: string;
  sort_order: number;
};

type SubjectGroup = {
  exam_type_id: string;
  subject_code: string;
  subject_name: string;
  icon: string;
  color: string;
  boards: Array<{
    subject_id: string;
    exam_board_id: string;
    exam_board_name: string;
  }>;
};

function keyFor(examTypeId: string, subjectCode: string) {
  return `${examTypeId}:${subjectCode}`;
}

function Modal(props: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { open, title, subtitle, onClose, children } = props;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        role="button"
        tabIndex={-1}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>

          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function SubjectBoardStep(props: {
  examTypeIds: string[];
  selectedSubjectIds: string[];
  onChangeSelectedSubjectIds: (ids: string[]) => void;
  onBackToExamTypes: () => void;
  onDone: () => void;
}) {
  const {
    examTypeIds,
    selectedSubjectIds,
    onChangeSelectedSubjectIds,
    onBackToExamTypes,
    onDone,
  } = props;

  const [loading, setLoading] = useState(true);
  const [rawRows, setRawRows] = useState<RpcSubjectRow[]>([]);
  const [examTypes, setExamTypes] = useState<ExamTypeRow[]>([]);
  const [search, setSearch] = useState("");
  const [activeExamTypeIndex, setActiveExamTypeIndex] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalGroupKey, setModalGroupKey] = useState<string | null>(null);

  // Keep index valid if examTypeIds changes
  useEffect(() => {
    setActiveExamTypeIndex(0);
  }, [examTypeIds.join("|")]);

  // Load exam types (for names in headings + lozenges)
  useEffect(() => {
    let mounted = true;

    async function loadExamTypes() {
      try {
        const { data, error } = await supabase.rpc("rpc_list_exam_types");
        if (!mounted) return;

        if (!error && Array.isArray(data)) {
          setExamTypes(data as ExamTypeRow[]);
        } else {
          setExamTypes([]);
        }
      } catch {
        if (mounted) setExamTypes([]);
      }
    }

    loadExamTypes();
    return () => {
      mounted = false;
    };
  }, []);

  // Load subjects via RPC
  useEffect(() => {
    let mounted = true;

    async function loadSubjects() {
      setLoading(true);

      if (!examTypeIds || examTypeIds.length === 0) {
        setRawRows([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("rpc_list_subjects_for_exam_types", {
          p_exam_type_ids: examTypeIds,
        });

        if (!mounted) return;

        if (!error && Array.isArray(data)) {
          setRawRows(data as RpcSubjectRow[]);
        } else {
          setRawRows([]);
        }
      } catch {
        if (mounted) setRawRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSubjects();
    return () => {
      mounted = false;
    };
  }, [examTypeIds.join("|")]);

  const examTypeNameById = useMemo(() => {
    const m = new Map<string, string>();
    examTypes.forEach((e) => m.set(e.id, e.name));
    return m;
  }, [examTypes]);

  const activeExamTypeId = examTypeIds?.[activeExamTypeIndex] ?? null;
  const activeExamTypeName = activeExamTypeId ? (examTypeNameById.get(activeExamTypeId) ?? "Exam") : "Exam";

  // Group rows into subjects (one card per subject_code per exam type)
  const grouped: SubjectGroup[] = useMemo(() => {
    const map = new Map<string, SubjectGroup>();

    for (const r of rawRows) {
      const k = keyFor(r.exam_type_id, r.subject_code);
      const existing = map.get(k);

      if (!existing) {
        map.set(k, {
          exam_type_id: r.exam_type_id,
          subject_code: r.subject_code,
          subject_name: r.subject_name,
          icon: r.icon,
          color: r.color,
          boards: [
            {
              subject_id: r.subject_id,
              exam_board_id: r.exam_board_id,
              exam_board_name: r.exam_board_name,
            },
          ],
        });
      } else {
        existing.boards.push({
          subject_id: r.subject_id,
          exam_board_id: r.exam_board_id,
          exam_board_name: r.exam_board_name,
        });
      }
    }

    // Sort boards alphabetically per subject
    for (const g of map.values()) {
      g.boards.sort((a, b) => (a.exam_board_name ?? "").localeCompare(b.exam_board_name ?? ""));
    }

    // Sort subjects by subject name
    return Array.from(map.values()).sort((a, b) => a.subject_name.localeCompare(b.subject_name));
  }, [rawRows]);

  const groupedByKey = useMemo(() => {
    const m = new Map<string, SubjectGroup>();
    grouped.forEach((g) => m.set(keyFor(g.exam_type_id, g.subject_code), g));
    return m;
  }, [grouped]);

  // Resolve current selections into a map keyed by examType+subject_code
  const selectionByGroupKey = useMemo(() => {
    const selectedSet = new Set((selectedSubjectIds ?? []).filter(Boolean));
    const m = new Map<string, { subject_id: string; exam_board_name: string }>();

    for (const r of rawRows) {
      if (!selectedSet.has(r.subject_id)) continue;
      const k = keyFor(r.exam_type_id, r.subject_code);
      m.set(k, { subject_id: r.subject_id, exam_board_name: r.exam_board_name });
    }

    return m;
  }, [rawRows, selectedSubjectIds.join("|")]);

  const activeGroups: SubjectGroup[] = useMemo(() => {
    if (!activeExamTypeId) return [];

    const term = search.trim().toLowerCase();
    const base = grouped.filter((g) => g.exam_type_id === activeExamTypeId);

    if (!term) return base;

    return base.filter((g) => g.subject_name.toLowerCase().includes(term));
  }, [grouped, activeExamTypeId, search]);

  function openBoardModal(groupKey: string) {
    setModalGroupKey(groupKey);
    setModalOpen(true);
  }

  function closeBoardModal() {
    setModalOpen(false);
    setModalGroupKey(null);
  }

  function removeSelectionForGroup(groupKey: string) {
    const existing = selectionByGroupKey.get(groupKey);
    if (!existing) return;

    const next = (selectedSubjectIds ?? []).filter((id) => id !== existing.subject_id);
    onChangeSelectedSubjectIds(next);
  }

  function setSelectionForGroup(groupKey: string, subjectId: string) {
    // ensure only one selection per groupKey (examType+subjectCode)
    const existing = selectionByGroupKey.get(groupKey);

    let next = (selectedSubjectIds ?? []).slice();

    if (existing?.subject_id) {
      next = next.filter((id) => id !== existing.subject_id);
    }

    if (!next.includes(subjectId)) next.push(subjectId);

    onChangeSelectedSubjectIds(next);
    closeBoardModal();
  }

  const chips = useMemo(() => {
    const selectedSet = new Set((selectedSubjectIds ?? []).filter(Boolean));

    // Build chip list from rawRows so we can show board + exam type + subject
    const rows = rawRows
      .filter((r) => selectedSet.has(r.subject_id))
      .map((r) => ({
        subject_id: r.subject_id,
        exam_type_id: r.exam_type_id,
        exam_type_name: examTypeNameById.get(r.exam_type_id) ?? "Exam",
        subject_name: r.subject_name,
        subject_code: r.subject_code,
        exam_board_name: r.exam_board_name,
        group_key: keyFor(r.exam_type_id, r.subject_code),
      }));

    // Sort chips by exam type name then subject name
    rows.sort((a, b) => {
      const et = a.exam_type_name.localeCompare(b.exam_type_name);
      if (et !== 0) return et;
      return a.subject_name.localeCompare(b.subject_name);
    });

    return rows;
  }, [rawRows, selectedSubjectIds.join("|"), examTypeNameById]);

  const canContinueThisExamType = useMemo(() => {
    if (!activeExamTypeId) return false;
    // must have at least one subject selection *for this exam type* before continuing
    return chips.some((c) => c.exam_type_id === activeExamTypeId);
  }, [chips, activeExamTypeId]);

  function handleContinue() {
    // if more exam types remain, move to next
    const nextIndex = activeExamTypeIndex + 1;
    if (nextIndex < examTypeIds.length) {
      setActiveExamTypeIndex(nextIndex);
      setSearch("");
      return;
    }
    onDone();
  }

  const modalGroup = modalGroupKey ? groupedByKey.get(modalGroupKey) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Pick subjects{activeExamTypeId ? ` for ${activeExamTypeName}` : ""}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose a subject, then select the exam board.
          </p>
        </div>

        {/* Optional skip hook for future – leaving out for now to avoid “continue with zero” ambiguity */}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border border-gray-200 px-5 py-3 pr-12 outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
          placeholder="Search for a subject"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Loading subjects…
        </div>
      ) : !activeExamTypeId ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          No exam type selected. Please go back and choose at least one exam type.
        </div>
      ) : activeGroups.length === 0 ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          No subjects found for {activeExamTypeName}. Check your subject data.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeGroups.map((g) => {
            const gk = keyFor(g.exam_type_id, g.subject_code);
            const selected = selectionByGroupKey.get(gk);

            return (
              <button
                key={gk}
                type="button"
                onClick={() => openBoardModal(gk)}
                className={[
                  "rounded-2xl border px-5 py-4 text-left transition shadow-sm",
                  selected ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: g.color || "#7C3AED" }}
                    >
                      {/* lightweight icon placeholder */}
                      {g.subject_name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{g.subject_name}</p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {selected ? `Board: ${selected.exam_board_name}` : "Choose exam board"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={[
                      "inline-flex h-6 w-6 rounded border items-center justify-center",
                      selected ? "border-blue-500 bg-blue-500" : "border-gray-300",
                    ].join(" ")}
                  >
                    {selected ? <span className="text-white text-sm">✓</span> : null}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Chips / lozenges */}
      <div className="pt-2">
        <div className="text-sm text-gray-700">
          Your Subjects:
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {chips.length === 0 ? (
            <span className="text-sm text-gray-500">None selected yet</span>
          ) : (
            chips.map((c) => (
              <span
                key={c.subject_id}
                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-800"
              >
                <span className="whitespace-nowrap">
                  {c.exam_type_name} • {c.exam_board_name} • {c.subject_name}
                </span>
                <button
                  type="button"
                  onClick={() => removeSelectionForGroup(c.group_key)}
                  className="rounded-full bg-white/70 hover:bg-white px-2 py-0.5 text-gray-700 border border-gray-200"
                  aria-label="Remove subject"
                  title="Remove"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="pt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToExamTypes}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Back
        </button>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinueThisExamType}
          className="rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          Continue
        </button>
      </div>

      {/* Board modal */}
      <Modal
        open={modalOpen}
        title={modalGroup ? `Choose an exam board for ${modalGroup.subject_name}` : "Choose an exam board"}
        subtitle="You can change this later."
        onClose={closeBoardModal}
      >
        {!modalGroup ? (
          <div className="text-sm text-gray-600">Loading…</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {modalGroup.boards.map((b) => {
              const gk = keyFor(modalGroup.exam_type_id, modalGroup.subject_code);
              const selected = selectionByGroupKey.get(gk)?.subject_id === b.subject_id;

              return (
                <button
                  key={b.subject_id}
                  type="button"
                  onClick={() => setSelectionForGroup(gk, b.subject_id)}
                  className={[
                    "rounded-xl border px-4 py-3 text-sm font-medium transition",
                    selected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:bg-gray-50 text-gray-900",
                  ].join(" ")}
                >
                  {b.exam_board_name}
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
