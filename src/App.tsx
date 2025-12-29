// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import ParentOnboardingPage from "./pages/parent/ParentOnboardingPage";
import ParentDashboard from "./pages/ParentDashboard";
import Today from "./pages/child/Today";
import SessionOverview from "./pages/child/SessionOverview";
import SessionRun from "./pages/child/SessionRun";
import ChildSignUp from "./pages/child/ChildSignUp";
import { useAuth } from "./contexts/AuthContext";

function HomeGate() {
  const { loading, user, isParent, isChild, isUnresolved, parentChildCount } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Loading…
      </div>
    );
  }

  // Logged out => Landing
  if (!user) return <Landing />;

  // If unresolved, send to Landing for now
  if (isUnresolved) return <Landing />;

  if (isParent) {
    if ((parentChildCount ?? 0) === 0) return <Navigate to="/parent/onboarding" replace />;
    return <Navigate to="/parent" replace />;
  }

  if (isChild) return <Navigate to="/child/today" replace />;

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