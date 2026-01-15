// src/components/parent/dashboard/ResourcesSection.tsx
// Help and resources links for Parent Dashboard v2 (FEAT-009)

import React from "react";

const resources = [
  {
    title: "Getting Started Guide",
    description: "How to set up effective revision schedules",
    icon: "fa-book",
    href: "/help/getting-started",
  },
  {
    title: "Supporting Your Child",
    description: "Tips for parents during exam season",
    icon: "fa-heart",
    href: "/help/parent-guide",
  },
  {
    title: "Understanding Progress",
    description: "What the metrics mean and how to use them",
    icon: "fa-chart-line",
    href: "/help/progress-guide",
  },
];

export function ResourcesSection() {
  return (
    <section className="mb-10">
      <h3 className="text-lg font-bold text-primary-900 mb-4">Resources & Help</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {resources.map((resource) => (
          <a
            key={resource.href}
            href={resource.href}
            className="bg-neutral-0 rounded-xl p-5 shadow-soft hover:shadow-card transition-all border border-neutral-200/50 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
                <i className={`fa-solid ${resource.icon} text-primary-600`}></i>
              </div>
              <div>
                <div className="text-sm font-semibold text-primary-900 mb-1">{resource.title}</div>
                <div className="text-xs text-neutral-500">{resource.description}</div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export default ResourcesSection;