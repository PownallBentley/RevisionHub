// src/components/layout/AppHeader.tsx

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap,
  faChevronDown,
  faSignOutAlt,
  faCog,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../contexts/AuthContext";
import ParentNav from "./ParentNav";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getDisplayName(profile: any, isChild: boolean): string {
  if (!profile) return "User";

  if (isChild) {
    return profile.preferred_name || profile.first_name || "Student";
  }

  if (profile.full_name) {
    return profile.full_name.split(" ")[0];
  }
  if (profile.email) {
    return profile.email.split("@")[0];
  }
  return "User";
}

export default function AppHeader() {
  const navigate = useNavigate();
  const { user, profile, isChild, isParent, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!user;
  const displayName = getDisplayName(profile, isChild);
  const initials = getInitials(displayName);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSignOut() {
    setDropdownOpen(false);
    navigate("/", { replace: true });
    signOut();
  }

  // Dynamic styling based on user type
  const headerBg = isChild
    ? "bg-primary-50 border-primary-100"
    : "bg-neutral-0 border-neutral-200";

  return (
    <header className={`${headerBg} border-b sticky top-0 z-50`}>
      <div className="max-w-content mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left side: Logo + Parent Nav */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faGraduationCap} className="text-white text-lg" />
            </div>
            <span className="text-xl font-bold text-primary-900">RevisionHub</span>
          </Link>

          {/* Parent Navigation */}
          {isLoggedIn && isParent && <ParentNav />}
        </div>

        {/* Right side */}
        {!isLoggedIn ? (
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="px-4 py-2 text-neutral-600 hover:text-primary-600 transition-colors text-sm font-medium"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="px-6 py-2 bg-primary-600 text-white rounded-pill hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              Sign up
            </Link>
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-neutral-100 transition-colors"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 text-sm font-semibold">
                  {initials}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-neutral-700">{displayName}</div>
                <div className="text-xs text-neutral-500">
                  {isChild ? "Student" : "Parent"}
                </div>
              </div>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`text-neutral-500 text-xs transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-card border border-neutral-200 py-1 z-50">
                {!isChild && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate("/settings");
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3"
                    >
                      <FontAwesomeIcon
                        icon={faCog}
                        className="text-neutral-400 w-4"
                      />
                      Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate("/account");
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3"
                    >
                      <FontAwesomeIcon
                        icon={faUser}
                        className="text-neutral-400 w-4"
                      />
                      My Account
                    </button>
                    <div className="border-t border-neutral-200 my-1" />
                  </>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full px-4 py-2.5 text-left text-sm text-accent-red hover:bg-red-50 flex items-center gap-3"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}