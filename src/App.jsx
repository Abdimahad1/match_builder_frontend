import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { CelebrationProvider } from "./contexts/CelebrationContext"; // Import the provider
import Loading from "./pages/Loading";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Match from "./pages/Match";
import Leagues from "./pages/Leagues";
import Settings from "./pages/Settings";
import Report from "./pages/Report";
import Admin from "./pages/Admin";
import CreateLeague from "./pages/CreateLeague";

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [hasCompletedLoading, setHasCompletedLoading] = useState(false);
  const [isCheckingLoading, setIsCheckingLoading] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem('hasCompletedLoading') === 'true';
    setHasCompletedLoading(completed);
    setIsCheckingLoading(false);
  }, []);

  const handleLoadingComplete = () => {
    localStorage.setItem('hasCompletedLoading', 'true');
    setHasCompletedLoading(true);
  };

  if (isCheckingLoading) return null;

  return (
    <div className="min-h-screen">
      {/* Wrap all routes with CelebrationProvider */}
      <CelebrationProvider>
        <Routes>
          <Route
            path="/"
            element={
              !hasCompletedLoading ? (
                <Loading onComplete={handleLoadingComplete} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes - all have access to CelebrationContext */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/match" element={<PrivateRoute><Match /></PrivateRoute>} />
          <Route path="/leagues" element={<PrivateRoute><Leagues /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/report" element={<PrivateRoute><Report /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
          <Route path="/create-league" element={<PrivateRoute><CreateLeague /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </CelebrationProvider>
    </div>
  );
}