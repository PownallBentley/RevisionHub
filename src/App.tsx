// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import ParentOnboardingPage from "./pages/parent/ParentOnboardingPage";
import ParentDashboard from "./pages/ParentDashboard";
import SubjectProgress from "./pages/parent/SubjectProgress";
import Timetable from "./pages/parent/Timetable";
import Account from "./pages/Account";
import Today from "./pages/child/Today";
import SessionOverview from "./pages/child/SessionOverview";
import SessionRun from "./pages/child/SessionRun";
import ChildSignUp from "./pages/child/ChildSignUp";
import { useAuth } from "./contexts/AuthContext";

function HomeGate() {
  const { loading, user, isParent, isChild, isUnresolved, parentChildCount } = useAuth();

  // Still checking auth - show loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-neutral-600">
        Loading…
      </div>
    );
  }

  // Not logged in - show Landing
  if (!user) {
    return <Landing />;
  }

  // User exists but role not determined yet (profile didn't load)
  // Show landing page with login/signup options
  if (isUnresolved) {
    return <Landing />;
  }

  // Child user - go to Today
  if (isChild) {
    return <Navigate to="/child/today" replace />;
  }

  // Parent user
  if (isParent) {
    // Only redirect to onboarding if we KNOW they have 0 children (not null)
    if (parentChildCount === 0) {
      return <Navigate to="/parent/onboarding" replace />;
    }
    // Either has children or still loading count - go to dashboard
    return <Navigate to="/parent" replace />;
  }

  // Fallback - should not reach here, but show landing
  return <Landing />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          {/* Home gate - handles routing based on auth state */}
          <Route path="/" element={<HomeGate />} />

          {/* Public auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Child invite signup */}
          <Route path="/child/signup" element={<ChildSignUp />} />

          {/* Parent routes */}
          <Route path="/parent/onboarding" element={<ParentOnboardingPage />} />
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/parent/subjects" element={<SubjectProgress />} />
          <Route path="/parent/timetable" element={<Timetable />} />

          {/* Shared routes (parent & child) */}
          <Route path="/account" element={<Account />} />

          {/* Child routes */}
          <Route path="/child/today" element={<Today />} />
          <Route path="/child/session/:plannedSessionId" element={<SessionOverview />} />
          <Route path="/child/session/:plannedSessionId/run" element={<SessionRun />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}