// src/components/parentOnboarding/steps/SubjectBoardStep.tsx

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
  rpcListSubjectGroupsForExamTypes,
  type SubjectGroupRow,
  type SubjectGroupBoardOption,
} from "../../../services/parentOnboarding/parentOnboardingService";

type ExamTypeRow = { id: string; name: string; code: string };

export type SelectedSubject = {
  exam_type_id: string;
  exam_type_name: string;
  subject_code: string;
  subject_name: string;

  // chosen board/spec row (this is what backend needs)
  subject_id: string;

  exam_board_id: string | null;
  exam_board_name: string | null;
};

function keyFor(group: { exam_type_id: string; subject_code: string }) {
  return `${group.exam_type_id}::${group.subject_code}`;
}

function chipLabel(s: SelectedSubject) {
  const board = s.exam_board_name ? s.exam_board_name : "Not sure";
  return `${s.exam_type_name} • ${board} • ${s.subject_name}`;
}

function Modal(props: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={props.onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{props.title}</h3>
            {props.subtitle ? <p className="text-sm text-gray-600 mt-1">{props.subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Close
          </button>
        </div>
        <div className="mt-5">{props.children}</div>
      </div>
    </div>
  );
}

export default function SubjectBoardStep(props: {
  examTypeIds: string[];
  value: SelectedSubject[];
  onChange: (next: SelectedSubject[]) => void;

  onBackToExamTypes: () => void;
  onDone: () => void;
}) {
  const { examTypeIds, value, onChange, onBackToExamTypes, onDone } = props;

  const [examTypes, setExamTypes] = useState<Record<string, ExamTypeRow>>({});
  const [cursor, setCursor] = useState(0);

  const [rows, setRows] = useState<SubjectGroupRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");

  // modal state
  const [activeGroup, setActiveGroup] = useState<SubjectGroupRow | null>(null);

  // Load exam type names once (for chip labels + heading)
  useEffect(() => {
    let mounted = true;

    async function loadExamTypes() {
      const { data, error } = await supabase
        .from("exam_types")
        .select("id, name, code")
        .order("sort_order", { ascending: true });

      if (!mounted) return;

      if (!error && Array.isArray(data)) {
        const map: Record<string, ExamTypeRow> = {};
        (data as any[]).forEach((r) => {
          map[String(r.id)] = { id: String(r.id), name: String(r.name), code: String(r.code) };
        });
        setExamTypes(map);
      } else {
        setExamTypes({});
      }
    }

    loadExamTypes();
    return () => {
      mounted = false;
    };
  }, []);

  // Ensure cursor stays in range if examTypeIds changes
  useEffect(() => {
    setCursor(0);
  }, [examTypeIds.join("|")]);

  const currentExamTypeId = examTypeIds?.[cursor] ?? null;
  const currentExamTypeName =
    (currentExamTypeId && examTypes[currentExamTypeId]?.name) || "Selected exam";

  // Load grouped subjects for the current exam type only (faster + simpler UI)
  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!currentExamTypeId) {
        setRows([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await rpcListSubjectGroupsForExamTypes([currentExamTypeId]);
        if (!mounted) return;
        setRows(data);
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
  }, [currentExamTypeId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.subject_name.toLowerCase().includes(q));
  }, [rows, query]);

  const selectedByKey = useMemo(() => {
    const map = new Map<string, SelectedSubject>();
    (value ?? []).forEach((s) => {
      map.set(keyFor({ exam_type_id: s.exam_type_id, subject_code: s.subject_code }), s);
    });
    return map;
  }, [JSON.stringify(value ?? [])]);

  function removeSelection(exam_type_id: string, subject_code: string) {
    const k = keyFor({ exam_type_id, subject_code });
    const next = (value ?? []).filter(
      (s) => keyFor({ exam_type_id: s.exam_type_id, subject_code: s.subject_code }) !== k
    );
    onChange(next);
  }

  function openBoardPicker(group: SubjectGroupRow) {
    setActiveGroup(group);
  }

  function chooseBoard(group: SubjectGroupRow, board: SubjectGroupBoardOption | null) {
    const examTypeName = examTypes[group.exam_type_id]?.name ?? "Exam";

    const nextItem: SelectedSubject = {
      exam_type_id: group.exam_type_id,
      exam_type_name: examTypeName,
      subject_code: group.subject_code,
      subject_name: group.subject_name,

      // If "not sure", still pick a deterministic subject_id so planning can proceed.
      // We use the first board row as the default row, but label board as null.
      subject_id: board?.subject_id ?? group.boards?.[0]?.subject_id ?? "",

      exam_board_id: board?.exam_board_id ?? null,
      exam_board_name: board?.exam_board_name ?? null,
    };

    // Replace any prior selection for this (exam_type_id, subject_code)
    const k = keyFor(group);
    const kept = (value ?? []).filter(
      (s) => keyFor({ exam_type_id: s.exam_type_id, subject_code: s.subject_code }) !== k
    );

    onChange([...kept, nextItem]);
    setActiveGroup(null);
  }

  const currentExamSelectedCount = useMemo(() => {
    return (value ?? []).filter((s) => s.exam_type_id === currentExamTypeId).length;
  }, [JSON.stringify(value ?? []), currentExamTypeId]);

  const canContinueThisExam = currentExamSelectedCount > 0;

  function handleContinue() {
    // Move to next selected exam type (GCSE -> IGCSE), else done.
    if (cursor < (examTypeIds?.length ?? 0) - 1) {
      setCursor((c) => c + 1);
      setQuery("");
      setActiveGroup(null);
      return;
    }
    onDone();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Pick subjects for {currentExamTypeName}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Tap a subject, then choose the exam board. You can change this later.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="w-full">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border border-gray-200 bg-white px-5 py-3 pr-12 outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
              placeholder="Search for a subject"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">⌕</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Loading subjects…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          No subjects found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((g) => {
            const sel = selectedByKey.get(keyFor(g));
            const selected = !!sel;

            const badgeLetter = (g.subject_name?.trim()?.[0] ?? "S").toUpperCase();
            const badgeStyle = {
              backgroundColor: g.color ?? "#7C3AED",
            } as any;

            return (
              <button
                key={keyFor(g)}
                type="button"
                onClick={() => openBoardPicker(g)}
                className={[
                  "rounded-2xl border p-5 text-left transition shadow-sm",
                  selected ? "border-brand-purple bg-brand-purple/5" : "border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={badgeStyle}
                    >
                      {badgeLetter}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{g.subject_name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {sel
                          ? `Board: ${sel.exam_board_name ?? "Not sure"}`
                          : "Tap to choose board"}
                      </div>
                    </div>
                  </div>

                  <div
                    className={[
                      "h-6 w-6 rounded border flex items-center justify-center",
                      selected ? "border-brand-purple" : "border-gray-300",
                    ].join(" ")}
                  >
                    {selected ? <div className="h-4 w-4 rounded bg-brand-purple" /> : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Chips / lozenges */}
      <div className="pt-2">
        <div className="text-sm text-gray-700 mb-2">Your subjects:</div>
        <div className="flex flex-wrap gap-2">
          {(value ?? [])
            .sort((a, b) => (a.exam_type_name + a.subject_name).localeCompare(b.exam_type_name + b.subject_name))
            .map((s) => (
              <span
                key={`${s.exam_type_id}:${s.subject_code}`}
                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-800"
              >
                {chipLabel(s)}
                <button
                  type="button"
                  onClick={() => removeSelection(s.exam_type_id, s.subject_code)}
                  className="h-5 w-5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  aria-label="Remove"
                >
                  ×
                </button>
              </span>
            ))}
          {(value ?? []).length === 0 ? (
            <span className="text-sm text-gray-500">None selected yet.</span>
          ) : null}
        </div>
      </div>

      {/* Footer buttons */}
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
          disabled={!canContinueThisExam}
          className="rounded-full bg-blue-600 px-10 py-3 text-sm text-white font-semibold disabled:opacity-40"
        >
          Continue
        </button>
      </div>

      {/* Board modal */}
      <Modal
        open={!!activeGroup}
        title={activeGroup ? `Choose an exam board for ${activeGroup.subject_name}` : ""}
        subtitle="You can always add or change this later."
        onClose={() => setActiveGroup(null)}
      >
        <div className="flex flex-wrap gap-3">
          {(activeGroup?.boards ?? []).map((b) => (
            <button
              key={b.exam_board_id}
              type="button"
              onClick={() => activeGroup && chooseBoard(activeGroup, b)}
              className="rounded-full border border-gray-200 bg-gray-50 px-6 py-3 text-sm hover:bg-gray-100"
            >
              {b.exam_board_name}
            </button>
          ))}

          <button
            type="button"
            onClick={() => activeGroup && chooseBoard(activeGroup, null)}
            className="rounded-full border border-gray-200 bg-gray-50 px-6 py-3 text-sm hover:bg-gray-100"
          >
            I’m not sure
          </button>
        </div>
      </Modal>
    </div>
  );
}
