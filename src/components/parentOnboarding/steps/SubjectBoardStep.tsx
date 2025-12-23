import { useEffect, useMemo, useState } from "react";
import {
  rpcListSubjectsForExamTypes,
  type SubjectPick,
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

  const [rows, setRows] = useState<SubjectPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => new Set((selectedSubjectIds ?? []).filter(Boolean)),
    [selectedSubjectIds]
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await rpcListSubjectsForExamTypes(examTypeIds);
        if (!mounted) return;
        setRows(data);
      } catch (e: any) {
        if (!mounted) return;
        setRows([]);
        setError(e?.message ?? "Failed to load subjects");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [examTypeIds.join("|")]);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChangeSelectedSubjectIds(Array.from(next));
  }

  const canContinue = (selectedSubjectIds ?? []).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Pick subjects</h2>
        <p className="text-sm text-gray-600 mt-1">Choose the subject and exam board.</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Loading subjects…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 whitespace-pre-line">
          <div className="font-medium">Couldn’t load subjects</div>
          <div className="mt-1">{error}</div>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          No subjects returned for the selected exam type(s). Seed <code className="font-mono">subjects</code>.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const isOn = selected.has(r.subject_id);
            return (
              <button
                key={r.subject_id}
                type="button"
                onClick={() => toggle(r.subject_id)}
                className={[
                  "w-full rounded-2xl border px-5 py-4 text-left transition",
                  isOn ? "border-brand-purple bg-brand-purple/5" : "border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {r.subject_name}
                      <span className="text-gray-600 font-normal"> • {r.exam_board_name}</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{isOn ? "Selected" : "Tap to select"}</p>
                  </div>

                  <span
                    className={[
                      "mt-1 inline-flex h-5 w-5 rounded border items-center justify-center",
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
          onClick={onDone}
          disabled={!canContinue}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
