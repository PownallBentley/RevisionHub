// src/components/parentOnboarding/StepShell.tsx

import type { ReactNode } from "react";

export default function StepShell(props: {
  title: string;
  subtitle?: string;
  error?: string | null;
  children: ReactNode;
}) {
  const { title, subtitle, error, children } = props;

  return (
    <div className="min-h-screen bg-neutral-bg">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle ? <p className="text-sm text-gray-600 mt-2">{subtitle}</p> : null}
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-medium text-red-800">Something needs fixing</p>
            <p className="text-sm text-red-700 mt-1 whitespace-pre-line">{error}</p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
