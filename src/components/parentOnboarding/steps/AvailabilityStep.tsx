// src/components/parentOnboarding/steps/AvailabilityStep.tsx

export type SessionPattern = "p20" | "p45" | "p70";

export type Availability = Record<
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
  { sessions: number; session_pattern: SessionPattern }
>;

const days: Array<{ key: keyof Availability; label: string }> = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const patternLabels: Record<SessionPattern, string> = {
  p20: "20 mins (1 topic)",
  p45: "45 mins (2 topics)",
  p70: "70 mins (3 topics)",
};

export default function AvailabilityStep(props: {
  value: Availability;
  onChange: (next: Availability) => void;
}) {
  const { value, onChange } = props;

  function setDay<K extends keyof Availability>(day: K, next: Availability[K]) {
    onChange({ ...value, [day]: next });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">When can they study?</h2>
        <p className="text-sm text-gray-600 mt-1">
          Set a pattern that fits family life. You can change this later.
        </p>
      </div>

      <div className="space-y-3">
        {days.map((d) => {
          const v = value[d.key];
          return (
            <div
              key={d.key}
              className="rounded-2xl border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="min-w-[140px]">
                <p className="font-medium text-gray-900">{d.label}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {v.sessions === 0 ? "No sessions" : `${v.sessions} session${v.sessions === 1 ? "" : "s"}`}
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-3 md:items-center w-full md:justify-end">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Sessions</label>
                  <select
                    value={String(v.sessions)}
                    onChange={(e) =>
                      setDay(d.key, { ...v, sessions: Number(e.target.value) })
                    }
                    className="rounded-xl border border-gray-300 px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={String(n)}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Length</label>
                  <select
                    value={v.session_pattern}
                    onChange={(e) =>
                      setDay(d.key, { ...v, session_pattern: e.target.value as SessionPattern })
                    }
                    className="rounded-xl border border-gray-300 px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
                    disabled={v.sessions === 0}
                  >
                    {Object.keys(patternLabels).map((k) => (
                      <option key={k} value={k}>
                        {patternLabels[k as SessionPattern]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
        Tip: start light. Consistency beats intensity.
      </div>
    </div>
  );
}
