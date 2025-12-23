import { useEffect, useMemo, useState } from "react";
import {
  listNeedClusters,
  type NeedCluster,
} from "../../../services/referenceData/referenceDataService";

export type NeedClusterSelection = Array<{ cluster_code: string }>;

export default function NeedsStep(props: {
  value: NeedClusterSelection;
  onChange: (next: NeedClusterSelection) => void;
}) {
  const { value, onChange } = props;

  const [rows, setRows] = useState<NeedCluster[]>([]);
  const [loading, setLoading] = useState(true);

  const selected = useMemo(
    () => new Set(value.map((v) => v.cluster_code)),
    [value]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await listNeedClusters();
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

  function toggle(code: string) {
    const next = new Set(selected);
    next.has(code) ? next.delete(code) : next.add(code);
    onChange(Array.from(next).map((c) => ({ cluster_code: c })));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Any learning needs?</h2>

      {loading ? (
        <p className="text-sm text-gray-600">Loading…</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const isOn = selected.has(r.code);
            return (
              <button
                key={r.code}
                type="button"
                onClick={() => toggle(r.code)}
                className={`w-full rounded-2xl border px-5 py-4 text-left ${
                  isOn
                    ? "border-brand-purple bg-brand-purple/5"
                    : "border-gray-200"
                }`}
              >
                <p className="font-medium">{r.name}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
