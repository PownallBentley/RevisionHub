// src/components/layout/ParentNav.tsx

import { NavLink } from "react-router-dom";

export default function ParentNav() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-semibold transition-all duration-200 pb-1 ${
      isActive
        ? "text-primary-600 border-b-2 border-primary-600"
        : "text-neutral-600 hover:text-primary-600 hover:border-b-2 hover:border-primary-300 border-b-2 border-transparent"
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
       <NavLink to="/parent/insights" className={navLinkClass}>
        Insights
      </NavLink>
    </nav>
  );
}