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
import SessionRun from "./pages/child/SessionRun";
import ChildSignUp from "./pages/child/ChildSignUp";
import { useAuth } from "./contexts/AuthContext";

function HomeGate() {
  const { loading, user, isParent, isChild, isUnresolved, parentChildCount } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-neutral-600">
        Loading…
      </div>
    );
  }

  if (!user) return <Landing />;

  if (isUnresolved) return <Landing />;

  if (isChild) return <Navigate to="/child/today" replace />;

  if (isParent) {
    if (parentChildCount === 0) return <Navigate to="/parent/onboarding" replace />;
    return <Navigate to="/parent" replace />;
  }

  return <Landing />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          {/* Home gate */}
          <Route path="/" element={<HomeGate />} />

          {/* Public auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Child invite signup */}
          <Route path="/child/signup" element={<ChildSignUp />} />

          {/* Parent */}
          <Route path="/parent/onboarding" element={<ParentOnboardingPage />} />
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/parent/subjects" element={<SubjectProgress />} />
          <Route path="/parent/timetable" element={<Timetable />} />

          {/* Shared */}
          <Route path="/account" element={<Account />} />

          {/* Child */}
          <Route path="/child/today" element={<Today />} />

          {/* Canonical: planned session opens the runner directly (Preview is step 1) */}
          <Route path="/child/session/:plannedSessionId" element={<SessionRun />} />

          {/* Legacy route kept for backwards compatibility */}
          <Route path="/child/session/:plannedSessionId/run" element={<Navigate to=".." replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
