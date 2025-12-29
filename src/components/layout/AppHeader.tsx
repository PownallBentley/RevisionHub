// src/components/layout/AppHeader.tsx

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faChevronDown,
  faSignOutAlt,
  faCog,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../contexts/AuthContext";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getDisplayName(profile: any, isChild: boolean): string {
  if (!profile) return "User";

  if (isChild) {
    // Child: prefer preferred_name, then first_name
    return profile.preferred_name || profile.first_name || "Student";
  }

  // Parent: prefer full_name (first word), or fall back to email prefix
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
  const { user, profile, isChild, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!user;
  const displayName = getDisplayName(profile, isChild);
  const initials = getInitials(displayName);

  // Close dropdown when clicking outside
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

  async function handleSignOut() {
    setDropdownOpen(false);
    await signOut();
    navigate("/", { replace: true });
  }

  // Different styling for child vs parent
  const headerBg = isChild
    ? "bg-indigo-50 border-indigo-100"
    : "bg-white border-gray-100";
  const avatarBg = isChild
    ? "bg-gradient-to-br from-indigo-400 to-purple-500"
    : "bg-brand-purple";

  return (
    <header className={`${headerBg} border-b sticky top-0 z-50`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 text-gray-900 hover:opacity-80 transition-opacity"
        >
          <div
            className={`w-10 h-10 ${
              isChild ? "bg-indigo-500" : "bg-brand-purple"
            } rounded-xl flex items-center justify-center shadow-sm`}
          >
            <FontAwesomeIcon icon={faBookOpen} className="text-white text-lg" />
          </div>
          <div>
            <div className="text-base font-semibold leading-tight">
              RevisionHub
            </div>
            <div className="text-xs text-gray-500">
              {isChild ? "Your revision" : "Parent-led revision"}
            </div>
          </div>
        </Link>

        {/* Right side */}
        {!isLoggedIn ? (
          /* Logged out: Login + Signup buttons */
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-xl bg-brand-purple text-white hover:bg-brand-purple-dark text-sm font-semibold transition-colors"
            >
              Sign up
            </Link>
          </div>
        ) : (
          /* Logged in: Avatar + Name + Dropdown */
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/50 transition-colors"
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 ${avatarBg} rounded-full flex items-center justify-center text-white text-sm font-semibold`}
              >
                {initials}
              </div>
              {/* Name */}
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {displayName}
              </span>
              {/* Chevron */}
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`text-gray-400 text-xs transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                {!isChild && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate("/settings");
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <FontAwesomeIcon
                        icon={faCog}
                        className="text-gray-400 w-4"
                      />
                      Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate("/account");
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <FontAwesomeIcon
                        icon={faUser}
                        className="text-gray-400 w-4"
                      />
                      My Account
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                  </>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
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