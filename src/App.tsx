// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
  const { loading, user, isParent, isChild, isUnresolved, parentChildCount } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Loading…
      </div>
    );
  }

  // Logged out => show Landing
  if (!user) return <Landing />;

  // Logged in but cannot classify yet
  if (isUnresolved) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-xl border p-5">
          <div className="text-sm font-medium">Signed in, still resolving account type…</div>
          <div className="mt-2 text-sm text-gray-600">
            We can see your session, but can’t confirm parent profile or child link yet.
          </div>
        </div>
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

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomeGate />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Parent */}
        <Route path="/parent/onboarding" element={<ParentOnboardingPage />} />
        <Route path="/parent" element={<ParentDashboard />} />

        {/* Child */}
        <Route path="/child/signup" element={<ChildSignUp />} />
        <Route path="/child/today" element={<Today />} />
        <Route path="/child/session/:plannedSessionId" element={<SessionOverview />} />
        <Route path="/child/session/:plannedSessionId/run" element={<SessionRun />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
