// src/components/parentOnboarding/steps/ConfirmStep.tsx

import type { Availability } from "./AvailabilityStep";

function formatAvailability(av: Availability): Array<{ day: string; sessions: number; pattern: string }> {
  const map = [
    ["Monday", "monday"],
    ["Tuesday", "tuesday"],
    ["Wednesday", "wednesday"],
    ["Thursday", "thursday"],
    ["Friday", "friday"],
    ["Saturday", "saturday"],
    ["Sunday", "sunday"],
  ] as const;

  const labels: Record<string, string> = {
    p20: "20 mins",
    p45: "45 mins",
    p70: "70 mins",
  };

  return map.map(([label, key]) => ({
    day: label,
    sessions: av[key].sessions ?? 0,
    pattern: labels[av[key].session_pattern] ?? String(av[key].session_pattern),
  }));
}

export default function ConfirmStep(props: {
  payload: any;
  busy: boolean;
  onSubmit: () => Promise<void> | void;
}) {
  const { payload, busy, onSubmit } = props;

  const child = payload?.child ?? {};
  const availability = payload?.settings?.availability as Availability | undefined;

  const availRows = availability ? formatAvailability(availability) : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Confirm details</h2>
        <p className="text-sm text-gray-600 mt-1">
          We’ll create the plan and prepare today’s sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-900">Child</p>
          <p className="text-sm text-gray-700 mt-2">
            {(child.first_name ?? "").trim() || "—"}{" "}
            {(child.last_name ?? "").trim() ? child.last_name : ""}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {child.preferred_name ? `Preferred: ${child.preferred_name}` : "Preferred: —"}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {child.year_group ? `Year ${child.year_group}` : "Year —"}
            {child.country ? ` • ${child.country}` : ""}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-900">Plan choices</p>
          <p className="text-sm text-gray-700 mt-2">
            Goal: <span className="font-mono text-xs">{payload?.goal_code ?? "—"}</span>
          </p>
          <p className="text-sm text-gray-700 mt-2">
            Subjects:{" "}
            {Array.isArray(payload?.subject_ids) && payload.subject_ids.length > 0
              ? payload.subject_ids.length
              : 0}
          </p>
          <p className="text-sm text-gray-700 mt-2">
            Needs:{" "}
            {Array.isArray(payload?.need_clusters) && payload.need_clusters.length > 0
              ? payload.need_clusters.length
              : 0}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-900">Availability</p>

        {availRows.length === 0 ? (
          <p className="text-sm text-gray-600 mt-2">—</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {availRows.map((r) => (
              <div key={r.day} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-900">{r.day}</p>
                <p className="text-sm text-gray-700 mt-1">
                  {r.sessions} session{r.sessions === 1 ? "" : "s"} • {r.pattern}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={busy}
        className="w-full rounded-xl bg-brand-purple text-white py-3 font-semibold disabled:opacity-50"
      >
        {busy ? "Building your plan…" : "Create plan"}
      </button>

      <p className="text-xs text-gray-500">
        You can edit subjects and availability later from the parent dashboard.
      </p>
    </div>
  );
}
