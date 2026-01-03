// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import ParentOnboardingPage from "./pages/parent/ParentOnboardingPage";
import ParentDashboard from "./pages/ParentDashboard";
import SubjectProgress from "./pages/parent/SubjectProgress";
import Today from "./pages/child/Today";
import SessionOverview from "./pages/child/SessionOverview";
import SessionRun from "./pages/child/SessionRun";
import ChildSignUp from "./pages/child/ChildSignUp";
import { useAuth } from "./contexts/AuthContext";

function HomeGate() {
  const { 
    loading, 
    hydrating,
    user, 
    isParent, 
    isChild, 
    parentChildCount 
  } = useAuth();

  // Still checking auth - show loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Loading…
      </div>
    );
  }

  // Not logged in - show Landing
  if (!user) {
    return <Landing />;
  }

  // User is logged in but we're still fetching their profile/role
  // Show a brief loading state rather than making wrong routing decisions
  if (hydrating && !isParent && !isChild) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
        Loading…
      </div>
    );
  }

  // Child user - go to Today
  if (isChild) {
    return <Navigate to="/child/today" replace />;
  }

  // Parent user
  if (isParent) {
    // parentChildCount is null during hydration - only redirect to onboarding 
    // if we KNOW they have 0 children (not null)
    if (parentChildCount === 0) {
      return <Navigate to="/parent/onboarding" replace />;
    }
    // Either has children or still loading count - go to dashboard
    return <Navigate to="/parent" replace />;
  }

  // Fallback - user exists but role not determined
  // This shouldn't happen normally, but show Landing as safe fallback
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