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
          Pick subject
