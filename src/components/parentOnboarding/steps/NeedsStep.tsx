// src/components/parentOnboarding/steps/NeedsStep.tsx

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

export type NeedClusterSelection = Array<{ cluster_code: string }>;

type ClusterRow = {
  code: string;
  name: string;
  typical_behaviours: string[] | null;
};

export default function NeedsStep(props: {
  value: NeedClusterSelection;
  onChange: (next: NeedClusterSelection) => void;
}) {
  const { value, onChange } = props;

  const [rows, setRows] = useState<ClusterRow[]>([]);
  const [loading, setLoading] = useState(true);

  const selected = useMemo(() => {
    const s = new Set<string>();
    (value ?? []).forEach((v) => {
      if (v?.cluster_code) s.add(String(v.cluster_code));
    });
    return s;
  }, [JSON.stringify(value ?? [])]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("need_clusters")
          .select("code, name, typical_behaviours")
          .order("name", { ascending: true });

        if (!mounted) return;

        if (!error && Array.isArray(data)) {
          setRows(data as ClusterRow[]);
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

  function toggle(code: string) {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(Array.from(next).map((c) => ({ cluster_code: c })));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Any learning needs?</h2>
        <p className="text-sm text-gray-600 mt-1">
          Optional. Pick what sounds like your child so the plan feels kinder and more realistic.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Loading needs…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          No clusters found. If you haven’t seeded <code className="font-mono">need_clusters</code> yet,
          you can still continue.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const isOn = selected.has(r.code);
            return (
              <button
                key={r.code}
                type="button"
                onClick={() => toggle(r.code)}
                className={[
                  "w-full rounded-2xl border px-5 py-4 text-left transition",
                  isOn ? "border-brand-purple bg-brand-purple/5" : "border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{r.name}</p>
                    {Array.isArray(r.typical_behaviours) && r.typical_behaviours.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.typical_behaviours.slice(0, 6).map((t) => (
                          <span
                            key={t}
                            className="text-xs rounded-full bg-gray-100 px-2 py-1 text-gray-700"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">Tap to select</p>
                    )}
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
    </div>
  );
}
