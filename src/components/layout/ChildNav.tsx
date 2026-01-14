// src/components/layout/ChildNav.tsx
// Simple child navigation: single route back to Today

import { NavLink } from "react-router-dom";

export default function ChildNav() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-semibold transition-all duration-200 pb-1 ${
      isActive
        ? "text-primary-600 border-b-2 border-primary-600"
        : "text-neutral-600 hover:text-primary-600 hover:border-b-2 hover:border-primary-300 border-b-2 border-transparent"
    }`;

  return (
    <nav className="hidden md:flex items-center space-x-8">
      <NavLink to="/child/today" end className={navLinkClass}>
        Today’s revision
      </NavLink>
    </nav>
  );
}
