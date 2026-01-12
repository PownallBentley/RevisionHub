// src/components/parentOnboarding/steps/ExamTypeStep.tsx

import { useEffect, useMemo, useState } from "react";
import {
  listExamTypes,
  type ExamType,
} from "../../../services/referenceData/referenceDataService";

// Descriptions for exam types
const EXAM_TYPE_DESCRIPTIONS: Record<string, string> = {
  gcse: "General Certificate of Secondary Education",
  igcse: "International General Certificate of Secondary Education",
  a_level: "Advanced Level qualification",
  as_level: "Advanced Subsidiary qualification",
  ib: "International Baccalaureate",
  o_level: "Ordinary Level qualification",
  ap: "Advanced Placement",
};

function getExamTypeDescription(code: string, name: string): string {
  return EXAM_TYPE_DESCRIPTIONS[code?.toLowerCase()] ?? `${name} qualification`;
}

export default function ExamTypeStep(props: {
  value: string[];
  onChange: (examTypeIds: string[]) => void;
}) {
  const { value, onChange } = props;
  const [rows, setRows] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);

  const selected = useMemo(
    () => new Set((value ?? []).filter(Boolean)),
    [value]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await listExamTypes();
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
  }, []);

  function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(Array.from(next));
  }

  return (
    <div>
      {/* Section header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          Select exam types
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Choose all the exam types your child is preparing for. You can select more than one.
        </p>
      </div>

      {/* Exam type options */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <span className="ml-3 text-sm text-neutral-500">Loading exam types…</span>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => {
            const isOn = selected.has(r.id);
            const description = getExamTypeDescription(r.code ?? "", r.name);

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggle(r.id)}
                className={`w-full border-2 rounded-xl p-4 text-left transition-all ${
                  isOn
                    ? "border-primary-600 bg-primary-50"
                    : "border-neutral-200 hover:border-primary-300 hover:bg-primary-50"
                }`}
              >
                <div className="flex items-center">
                  {/* Checkbox */}
                  <div
                    className={`relative flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isOn
                        ? "bg-primary-600 border-primary-600"
                        : "bg-white border-neutral-300"
                    }`}
                  >
                    <i
                      className={`fa-solid fa-check text-white text-xs transition-opacity ${
                        isOn ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </div>

                  {/* Text content */}
                  <div className="ml-4 flex-1">
                    <span className="text-base font-semibold text-neutral-900">
                      {r.name}
                    </span>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Validation hint */}
      {!loading && selected.size === 0 && (
        <p className="mt-4 text-xs text-neutral-400">
          Select at least one exam type to continue.
        </p>
      )}
    </div>
  );
}