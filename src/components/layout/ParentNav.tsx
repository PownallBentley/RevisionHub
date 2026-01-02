// src/components/layout/ParentNav.tsx

import { NavLink } from "react-router-dom";

export default function ParentNav() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive
        ? "text-brand-purple"
        : "text-gray-600 hover:text-gray-900"
    }`;

  return (
    <nav className="flex items-center gap-6">
      <NavLink to="/parent" end className={navLinkClass}>
        Dashboard
      </NavLink>
      <NavLink to="/parent/subjects" className={navLinkClass}>
        Subjects
      </NavLink>
    </nav>
  );
}