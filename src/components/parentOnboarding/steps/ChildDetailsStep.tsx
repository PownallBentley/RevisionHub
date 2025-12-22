// src/components/parentOnboarding/steps/ChildDetailsStep.tsx

import type { ChangeEvent } from "react";

export type ChildDetails = {
  first_name: string;
  last_name?: string;
  preferred_name?: string;
  country?: string;
  year_group?: number;
};

export default function ChildDetailsStep(props: {
  value: ChildDetails;
  onChange: (next: ChildDetails) => void;
}) {
  const { value, onChange } = props;

  function set<K extends keyof ChildDetails>(key: K, v: ChildDetails[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Tell us about your child</h2>
        <p className="text-sm text-gray-600 mt-1">
          This helps us build a plan that feels realistic, not overwhelming.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First name</label>
          <input
            value={value.first_name ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) => set("first_name", e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
            placeholder="e.g. Hannah"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last name</label>
          <input
            value={value.last_name ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) => set("last_name", e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred name</label>
          <input
            value={value.preferred_name ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) => set("preferred_name", e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
            placeholder="Optional (what they like to be called)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Year group</label>
          <select
            value={String(value.year_group ?? 11)}
            onChange={(e) => set("year_group", Number(e.target.value))}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent bg-white"
          >
            {[7, 8, 9, 10, 11, 12, 13].map((y) => (
              <option key={y} value={String(y)}>
                Year {y}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
          <input
            value={value.country ?? "England"}
            onChange={(e: ChangeEvent<HTMLInputElement>) => set("country", e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
            placeholder="e.g. England"
          />
        </div>
      </div>
    </div>
  );
}
