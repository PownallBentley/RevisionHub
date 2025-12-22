// src/components/parentOnboarding/steps/GoalStep.tsx

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type GoalRow = {
  code: string;
  name: string;
  description: string | null;
};

const fallbackGoals: GoalRow[] = [
  { code: "pass_exam", name: "Pass the exam", description: "Focus on coverage and confidence." },
  { code: "improve_grade", name: "Improve the grade", description: "Target weaker areas and practise exam style." },
  { code: "reduce_anxiety", name: "Reduce anxiety", description: "Short, structured sessions to build momentum." },
];

export default function GoalStep(props: {
  value?: string;
  onChange: (goalCode: string) => void;
}) {
  const { value, onChange } = props;

  const [goals, setGoals] = useState<GoalRow[]>(fallbackGoals);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("goals")
          .select("code, name, description")
          .order("name", { ascending: true });

        if (!mounted) return;

        if (!error && Array.isArray(data) && data.length > 0) {
          setGoals(data as GoalRow[]);
        } else {
          setGoals(fallbackGoals);
        }
      } catch {
        if (mounted) setGoals(fallbackGoals);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">What’s the goal?</h2>
        <p className="text-sm text-gray-600 mt-1">Pick the outcome that matters most right now.</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Loading goals…
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const selected = value === g.code;
            return (
              <button
                key={g.code}
                type="button"
                onClick={() => onChange(g.code)}
                className={[
                  "w-full text-left rounded-2xl border px-5 py-4 transition",
                  selected
                    ? "border-brand-purple bg-brand-purple/5"
                    : "border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{g.name}</p>
                    {g.description ? (
                      <p className="text-sm text-gray-600 mt-1">{g.description}</p>
                    ) : null}
                  </div>
                  <div
                    className={[
                      "mt-1 h-5 w-5 rounded-full border flex items-center justify-center",
                      selected ? "border-brand-purple" : "border-gray-300",
                    ].join(" ")}
                  >
                    {selected ? <div className="h-3 w-3 rounded-full bg-brand-purple" /> : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
