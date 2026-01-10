// src/components/layout/ParentNav.tsx

import { NavLink } from "react-router-dom";

export default function ParentNav() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive
        ? "text-primary-600 border-b-2 border-primary-600 pb-1"
        : "text-neutral-600 hover:text-primary-600"
    }`;

  return (
    <nav className="hidden md:flex items-center space-x-8">
      <NavLink to="/parent" end className={navLinkClass}>
        Dashboard
      </NavLink>
      <NavLink to="/parent/subjects" className={navLinkClass}>
        Subjects
      </NavLink>
      <NavLink to="/parent/timetable" className={navLinkClass}>
        Timetable
      </NavLink>
    </nav>
  );
}