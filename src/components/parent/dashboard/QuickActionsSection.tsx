// src/components/parent/dashboard/QuickActionsSection.tsx
// Quick action buttons for Parent Dashboard v2 (FEAT-009)

import React from "react";
import { useNavigate } from "react-router-dom";

interface QuickAction {
  label: string;
  icon: string;
  path: string;
  description: string;
}

const actions: QuickAction[] = [
  {
    label: "View Schedule",
    icon: "fa-calendar",
    path: "/parent/schedule",
    description: "See all planned sessions",
  },
  {
    label: "Add Subject",
    icon: "fa-plus",
    path: "/parent/subjects",
    description: "Add or manage subjects",
  },
  {
    label: "Progress Report",
    icon: "fa-chart-bar",
    path: "/parent/insights",
    description: "Detailed analytics",
  },
  {
    label: "Settings",
    icon: "fa-cog",
    path: "/parent/settings",
    description: "Preferences & account",
  },
];

export function QuickActionsSection() {
  const navigate = useNavigate();

  return (
    <section className="mb-10">
      <h3 className="text-lg font-bold text-primary-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="bg-neutral-0 rounded-xl p-4 shadow-soft hover:shadow-card transition-all border border-neutral-200/50 text-left group"
          >
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary-200 transition-colors">
              <i className={`fa-solid ${action.icon} text-primary-600`}></i>
            </div>
            <div className="text-sm font-semibold text-primary-900">{action.label}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{action.description}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default QuickActionsSection;