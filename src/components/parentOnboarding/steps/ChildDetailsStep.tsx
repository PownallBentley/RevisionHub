// src/components/parentOnboarding/steps/ChildDetailsStep.tsx

import type { ChangeEvent } from "react";

export type ChildDetails = {
  first_name: string;
  last_name?: string;
  preferred_name?: string;
  country?: string;
  year_group?: number;
};

type ChildDetailsStepProps = {
  value: ChildDetails;
  onChange: (next: ChildDetails) => void;
};

export default function ChildDetailsStep({ value, onChange }: ChildDetailsStepProps) {
  function set<K extends keyof ChildDetails>(key: K, v: ChildDetails[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div>
      {/* Section header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">
          Tell us about your child
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed">
          This helps us build a plan that feels realistic, not overwhelming.
        </p>
      </div>

      {/* Form fields */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First name */}
          <div>
            <label
              htmlFor="first-name"
              className="block text-sm font-medium text-neutral-700 mb-2"
            >
              First name
            </label>
            <input
              type="text"
              id="first-name"
              value={value.first_name ?? ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                set("first_name", e.target.value)
              }
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
              placeholder="e.g. Hannah"
              required
            />
          </div>

          {/* Last name */}
          <div>
            <label
              htmlFor="last-name"
              className="block text-sm font-medium text-neutral-700 mb-2"
            >
              Last name
            </label>
            <input
              type="text"
              id="last-name"
              value={value.last_name ?? ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                set("last_name", e.target.value)
              }
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preferred name */}
          <div>
            <label
              htmlFor="preferred-name"
              className="block text-sm font-medium text-neutral-700 mb-2"
            >
              Preferred name
            </label>
            <input
              type="text"
              id="preferred-name"
              value={value.preferred_name ?? ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                set("preferred_name", e.target.value)
              }
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
              placeholder="What they like to be called"
            />
          </div>

          {/* Year group */}
          <div>
            <label
              htmlFor="year-group"
              className="block text-sm font-medium text-neutral-700 mb-2"
            >
              Year group
            </label>
            <select
              id="year-group"
              value={String(value.year_group ?? 11)}
              onChange={(e) => set("year_group", Number(e.target.value))}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all appearance-none cursor-pointer"
            >
              {[7, 8, 9, 10, 11, 12, 13].map((y) => (
                <option key={y} value={String(y)}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Country */}
        <div>
          <label
            htmlFor="country"
            className="block text-sm font-medium text-neutral-700 mb-2"
          >
            Country
          </label>
          <input
            type="text"
            id="country"
            value={value.country ?? "England"}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              set("country", e.target.value)
            }
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
            placeholder="e.g. England"
          />
        </div>
      </div>
    </div>
  );
}