import { useEffect, useMemo, useState } from "react";
import {
  listExamTypes,
  type ExamType,
} from "../../../services/referenceData/referenceDataService";

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
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Which exam type?</h2>

      {loading ? (
        <p className="text-sm text-gray-600">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map((r) => {
            const isOn = selected.has(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggle(r.id)}
                className={`rounded-2xl border px-5 py-4 text-left ${
                  isOn
                    ? "border-brand-purple bg-brand-purple/5"
                    : "border-gray-200"
                }`}
              >
                <span className="font-medium">{r.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
