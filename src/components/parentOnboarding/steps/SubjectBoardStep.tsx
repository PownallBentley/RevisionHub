import { useEffect, useMemo, useState } from "react";
import {
  listSubjectsForExamTypes,
  type Subject,
} from "../../../services/referenceData/referenceDataService";

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

  const [rows, setRows] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const selected = useMemo(
    () => new Set(selectedSubjectIds),
    [selectedSubjectIds]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const data = await listSubjectsForExamTypes(examTypeIds);
        if (mounted) setRows(data);
      } catch {
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [examTypeIds.join("|")]);

  function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    onChangeSelectedSubjectIds(Array.from(next));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Pick subjects</h2>

      {loading ? (
        <p className="text-sm text-gray-600">Loading…</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const isOn = selected.has(r.subject_id);
            return (
              <button
                key={r.subject_id}
                type="button"
                onClick={() => toggle(r.subject_id)}
                className={`w-full rounded-2xl border px-5 py-4 text-left ${
                  isOn
                    ? "border-brand-purple bg-brand-purple/5"
                    : "border-gray-200"
                }`}
              >
                <p className="font-medium">
                  {r.subject_name} • {r.exam_board_name}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={onBackToExamTypes} className="border px-4 py-2 rounded-lg">
          Back
        </button>
        <button
          onClick={onDone}
          disabled={selected.size === 0}
          className="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
