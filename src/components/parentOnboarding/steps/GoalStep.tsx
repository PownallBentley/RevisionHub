// src/components/parentOnboarding/steps/GoalStep.tsx

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

// Map goal codes to Font Awesome icons
const GOAL_ICONS: Record<string, string> = {
  top_grades: "fa-trophy",
  feel_confident: "fa-heart",
  understand_topics: "fa-lightbulb",
  stay_organised: "fa-calendar-check",
  pass_exam: "fa-check-circle",
  improve_grade: "fa-arrow-trend-up",
  just_pass: "fa-check-circle",
  // Default fallback
  default: "fa-bullseye",
};

function getGoalIcon(code: string): string {
  return GOAL_ICONS[code] ?? GOAL_ICONS.default;
}

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
    <div>
      {/* Section header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          What's the goal?
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Choose the main focus for your child's revision. You can change this later.
        </p>
      </div>

      {/* Goal options */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <span className="ml-3 text-sm text-neutral-500">Loading goals…</span>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((g) => {
            const selected = value === g.code;
            const iconClass = getGoalIcon(g.code);

            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onChange(g.code)}
                className={`w-full border-2 rounded-xl p-5 text-left transition-all ${
                  selected
                    ? "border-primary-600 bg-primary-50"
                    : "border-neutral-200 hover:border-primary-300 hover:shadow-soft"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center mt-0.5">
                    <i className={`fa-solid ${iconClass} text-primary-600 text-lg`} />
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-neutral-900 mb-1">
                      {g.name}
                    </h3>
                    {g.description && (
                      <p className="text-sm text-neutral-500 leading-relaxed">
                        {g.description}
                      </p>
                    )}
                  </div>

                  {/* Radio indicator */}
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors ${
                      selected ? "border-primary-600" : "border-neutral-300"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-primary-600 transition-opacity ${
                        selected ? "opacity-100" : "opacity-0"
                      }`}
                    />
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