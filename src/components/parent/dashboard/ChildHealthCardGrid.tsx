// src/components/parent/dashboard/ChildHealthCardGrid.tsx
// Grid container for child health cards (FEAT-009)

import React from "react";
import { ChildHealthCard } from "./ChildHealthCard";
import type { ChildHealthCardGridProps } from "../../../types/parent/parentDashboardTypes";

export function ChildHealthCardGrid({ 
  children, 
  onGoToToday, 
  onViewInsights 
}: ChildHealthCardGridProps) {
  if (children.length === 0) {
    return (
      <div className="bg-neutral-0 rounded-2xl shadow-card p-8 border border-neutral-200/50 text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-user-plus text-primary-600 text-2xl"></i>
        </div>
        <h4 className="text-lg font-bold text-primary-900 mb-2">No children added yet</h4>
        <p className="text-neutral-600 mb-4">Add your first child to get started with revision planning.</p>
        <button className="px-6 py-3 bg-primary-600 text-white rounded-pill font-semibold hover:bg-primary-700 transition-colors">
          Add a child
        </button>
      </div>
    );
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-primary-900">Your Children</h3>
        <button className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-2">
          View all activity
          <i className="fa-solid fa-arrow-right text-xs"></i>
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {children.map((child) => (
          <ChildHealthCard
            key={child.child_id}
            child={child}
            onGoToToday={onGoToToday}
            onViewInsights={onViewInsights}
          />
        ))}
      </div>
    </section>
  );
}

export default ChildHealthCardGrid;