// src/components/parentOnboarding/steps/ExamTypeStep.tsx

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type ExamTypeRow = {
  id: string;
  name: string;
};

export default function ExamTypeStep(props: {
  value: string[];
  onChange: (examTypeIds: string[]) => void;
}) {
  const { value, onChange } = props;

  const [rows, setRows] = useState<ExamTypeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const selected = useMemo(() => new Set((value ?? []).filter(Boolean)), [value]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("exam_types")
          .select("id, name")
          .order("name", { ascending: true });

        if (!mounted) return;

        if (!error && Array.isArray(data)) {
          setRows(data as ExamTypeRow[]);
        } else {
          setRows([]);
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
  }, []);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Which exam type?</h2>
        <p className="text-sm text-gray-600 mt-1">Choose one or more.</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Loading exam types…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          No exam types found. Check the <code className="font-mono">exam_types</code> table.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map((r) => {
            const isOn = selected.has(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggle(r.id)}
                className={[
                  "rounded-2xl border px-5 py-4 text-left transition",
                  isOn ? "border-brand-purple bg-brand-purple/5" : "border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-gray-900">{r.name}</span>
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
    </div>
  );
}
