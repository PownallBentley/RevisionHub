import { useEffect, useState } from "react";
import {
  listGoals,
  type Goal,
} from "../../../services/referenceData/referenceDataService";

const fallbackGoals: Goal[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    code: "pass_exam",
    name: "Pass the exam",
    description: "Focus on coverage and confidence.",
    sort_order: 100,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    code: "improve_grade",
    name: "Improve the grade",
    description: "Target weaker areas and practise exam style.",
    sort_order: 200,
  },
];

export default function GoalStep(props: {
  value?: string;
  onChange: (goalCode: string) => void;
}) {
  const { value, onChange } = props;

  const [goals, setGoals] = useState<Goal[]>(fallbackGoals);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await listGoals();
        if (mounted && data.length > 0) setGoals(data);
      } catch {
        /* fallback stays */
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">What’s the goal?</h2>

      {loading ? (
        <p className="text-sm text-gray-600">Loading…</p>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const selected = value === g.code;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onChange(g.code)}
                className={`w-full rounded-2xl border px-5 py-4 text-left ${
                  selected
                    ? "border-brand-purple bg-brand-purple/5"
                    : "border-gray-200"
                }`}
              >
                <p className="font-medium">{g.name}</p>
                {g.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {g.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
