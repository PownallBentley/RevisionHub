// src/components/parentOnboarding/steps/SubjectBoardStep.tsx

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

export type SubjectSelection = {
  exam_type_id: string;
  subject_code: string;
  subject_name: string;
  exam_board_id: string;
  exam_board_name: string;
  subject_id: string;
};

type SubjectRow = {
  subject_id: string;
  subject_name: string;
  exam_type_id: string;
  exam_board_id: string;
  exam_board_name: string;
  subject_code: string;
  icon: string | null;
  color: string | null;
};

type ExamTypeMeta = {
  id: string;
  name: string; // e.g. "GCSE", "IGCSE"
};

function normalise(s: string) {
  return (s ?? "").trim().toLowerCase();
}

function groupKey(r: SubjectRow) {
  return `${r.exam_type_id}::${r.subject_code}`;
}

export default function SubjectBoardStep(props: {
  // This step displays ONE exam type at a time (GCSE first, then IGCSE, etc.)
  examType: ExamTypeMeta;

  // All selections across all exam types (for breadcrumbs/lozenges)
  value: SubjectSelection[];
  onChange: (next: SubjectSelection[]) => void;

  onBack: () => void;
  onContinue: () => Promise<void> | void; // may advance to next exam type or to Needs step
}) {
  const { examType, value, onChange, onBack, onContinue } = props;

  const [rows, setRows] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [query, setQuery] = useState("");
  const [activeSubjectKey, setActiveSubjectKey] = useState<string | null>(null);

  // Load subjects for this single exam type
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        // Prefer RPC if you’ve standardised it
        const { data, error } = await supabase.rpc("rpc_list_subjects_for_exam_types", {
          p_exam_type_ids: [examType.id],
        });

        if (!mounted) return;

        if (error || !Array.isArray(data)) {
          setRows([]);
        } else {
          setRows(data as SubjectRow[]);
        }
      } catch {
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [examType.id]);

  // Group board-specific rows into one subject card
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        exam_type_id: string;
        subject_code: string;
        subject_name: string;
        icon: string | null;
        color: string | null;
        boards: Array<{
          subject_id: string;
          exam_board_id: string;
          exam_board_name: string;
        }>;
      }
    >();

    for (const r of rows) {
      const k = groupKey(r);
      if (!map.has(k)) {
        map.set(k, {
          exam_type_id: r.exam_type_id,
          subject_code: r.subject_code,
          subject_name: r.subject_name,
          icon: r.icon ?? "book",
          color: r.color ?? "#7C3AED",
          boards: [],
        });
      }
      map.get(k)!.boards.push({
        subject_id: r.subject_id,
        exam_board_id: r.exam_board_id,
        exam_board_name: r.exam_board_name,
      });
    }

    // sort boards within each subject
    for (const v of map.values()) {
      v.boards.sort((a, b) => a.exam_board_name.localeCompare(b.exam_board_name));
    }

    // turn into array + sort subjects
    const arr = Array.from(map.entries()).map(([key, v]) => ({ key, ...v }));
    arr.sort((a, b) => a.subject_name.localeCompare(b.subject_name));
    return arr;
  }, [rows]);

  // Filter by search query
  const visibleSubjects = useMemo(() => {
    const q = normalise(query);
    if (!q) return grouped;
    return grouped.filter((s) => normalise(s.subject_name).includes(q));
  }, [grouped, query]);

  // Selections for the current exam type
  const selectionsForThisExamType = useMemo(() => {
    return (value ?? []).filter((v) => v.exam_type_id === examType.id);
  }, [value, examType.id]);

  function getSelectionForSubject(subjectKey: string) {
    const subject = grouped.find((g) => g.key === subjectKey);
    if (!subject) return null;

    return (value ?? []).find(
      (v) => v.exam_type_id === subject.exam_type_id && v.subject_code === subject.subject_code
    );
  }

  function upsertSelection(subjectKey: string, choice: { subject_id: string; exam_board_id: string; exam_board_name: string }) {
    const subject = grouped.find((g) => g.key === subjectKey);
    if (!subject) return;

    const next: SubjectSelection[] = [];
    for (const v of value ?? []) {
      // remove any existing selection for this exam_type + subject_code
      if (v.exam_type_id === subject.exam_type_id && v.subject_code === subject.subject_code) continue;
      next.push(v);
    }

    next.push({
      exam_type_id: subject.exam_type_id,
      subject_code: subject.subject_code,
      subject_name: subject.subject_name,
      exam_board_id: choice.exam_board_id,
      exam_board_name: choice.exam_board_name,
      subject_id: choice.subject_id,
    });

    onChange(next);
  }

  function removeSelection(sel: SubjectSelection) {
    onChange((value ?? []).filter((v) => v.subject_id !== sel.subject_id));
  }

  const activeSubject = activeSubjectKey ? grouped.find((g) => g.key === activeSubjectKey) : null;

  const canContinue = selectionsForThisExamType.length > 0;

  async function handleContinue() {
    if (busy) return;
    setBusy(true);
    try {
      await onContinue();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Pick subjects for {examType.name}</h2>
        <p className="text-sm text-gray-600 mt-1">
          Choose each subject, then pick the exam board.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a subject"
          className="w-full rounded-full border border-gray-200 bg-white px-5 py-3 pr-12 outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">⌕</div>
      </div>

      {/* Subject cards */}
      {loading ? (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Loading subjects…
        </div>
      ) : visibleSubjects.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          No subjects found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleSubjects.map((s) => {
            const selected = getSelectionForSubject(s.key);
            const isOn = !!selected;

            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveSubjectKey(s.key)}
                className={[
                  "rounded-2xl border px-5 py-4 text-left transition shadow-sm",
                  isOn ? "border-brand-purple bg-brand-purple/5" : "border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: s.color ?? "#7C3AED" }}
                    >
                      {/* simple initial fallback */}
                      {(s.subject_name ?? "S").slice(0, 1).toUpperCase()}
                    </div>

                    <div>
                      <div className="font-medium text-gray-900">{s.subject_name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {isOn ? `Board: ${selected!.exam_board_name}` : "Tap to choose board"}
                      </div>
                    </div>
                  </div>

                  <span
                    className={[
                      "inline-flex h-5 w-5 rounded border items-center justify-center",
                      isOn ? "border-brand-purple" : "border-gray-300",
                    ].join(" ")}
                  >
                    {isOn ? <span className="h-3 w-3 rounded bg-brand-purple" /> : null}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Lozenges */}
      <div className="pt-2">
        <div className="text-sm text-gray-700 mb-2">Your subjects:</div>
        {(value ?? []).length === 0 ? (
          <div className="text-sm text-gray-500">None selected yet.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(value ?? []).map((sel) => (
              <span
                key={sel.subject_id}
                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-800"
              >
                <span className="text-gray-600">{/* exam type label */}</span>
                <span className="font-medium">
                  {sel.exam_type_id === examType.id ? examType.name : "—"}
                </span>
                <span className="text-gray-400">•</span>
                <span>{sel.exam_board_name}</span>
                <span className="text-gray-400">•</span>
                <span className="font-medium">{sel.subject_name}</span>

                <button
                  type="button"
                  onClick={() => removeSelection(sel)}
                  className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/60 hover:bg-white"
                  aria-label="Remove subject"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="pt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          disabled={busy}
        >
          Back
        </button>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue || busy}
          className="rounded-full bg-brand-purple px-8 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "Continuing…" : "Continue"}
        </button>
      </div>

      {/* Modal */}
      {activeSubject ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setActiveSubjectKey(null)}
          />
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl p-6">
            <div className="mb-4">
              <div className="text-lg font-semibold text-gray-900">
                Choose an exam board for {activeSubject.subject_name}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                You can always change this later.
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {activeSubject.boards
                .filter((b) => normalise(b.exam_board_name) !== "not sure yet")
                .map((b) => (
                  <button
                    key={b.exam_board_id}
                    type="button"
                    onClick={() => {
                      upsertSelection(activeSubject.key, b);
                      setActiveSubjectKey(null);
                    }}
                    className="rounded-full border border-gray-200 bg-gray-50 px-5 py-3 text-sm hover:bg-gray-100"
                  >
                    {b.exam_board_name}
                  </button>
                ))}
            </div>

            {/* "I'm not sure" pinned at bottom */}
            {activeSubject.boards.some((b) => normalise(b.exam_board_name) === "not sure yet") ? (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    const ns = activeSubject.boards.find((b) => normalise(b.exam_board_name) === "not sure yet")!;
                    upsertSelection(activeSubject.key, ns);
                    setActiveSubjectKey(null);
                  }}
                  className="w-full rounded-full bg-gray-100 px-5 py-3 text-sm font-medium hover:bg-gray-200"
                >
                  I’m not sure
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
