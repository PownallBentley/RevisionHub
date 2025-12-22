// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";

// Public pages (DO NOT change these UIs here)
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

// Parent pages
import ParentOnboardingPage from "./pages/parent/ParentOnboardingPage";
import ParentDashboard from "./pages/ParentDashboard";

// Child pages
import Today from "./pages/child/Today";
import SessionOverview from "./pages/child/SessionOverview";
import SessionRun from "./pages/child/SessionRun";
import ChildSignUp from "./pages/child/ChildSignUp";

function HomeGate() {
  const { loading, user, isParent, isChild, isUnresolved, parentChildCount, refresh } = useAuth();

  // If we have a session but role flags aren’t ready yet, try a refresh once.
  useEffect(() => {
    if (user && isUnresolved) {
      refresh?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isUnresolved]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Loading…
      </div>
    );
  }

  // Logged out => Landing
  if (!user) return <Landing />;

  // Don’t show a debug “resolving” screen — just a calm loader and let refresh settle.
  if (isUnresolved) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Finishing sign-in…
      </div>
    );
  }

  // Parent routing
  if (isParent) {
    if ((parentChildCount ?? 0) === 0) return <Navigate to="/parent/onboarding" replace />;
    return <Navigate to="/parent" replace />;
  }

  // Child routing
  if (isChild) {
    return <Navigate to="/child/today" replace />;
  }

  // Defensive fallback
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomeGate />} />

        {/* Public auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Child invite signup */}
        <Route path="/child/signup" element={<ChildSignUp />} />

        {/* Parent */}
        <Route path="/parent/onboarding" element={<ParentOnboardingPage />} />
        <Route path="/parent" element={<ParentDashboard />} />

        {/* Child */}
        <Route path="/child/today" element={<Today />} />
        <Route path="/child/session/:plannedSessionId" element={<SessionOverview />} />
        <Route path="/child/session/:plannedSessionId/run" element={<SessionRun />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
