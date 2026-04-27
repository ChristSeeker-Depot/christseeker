import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import JournalPage from './pages/JournalPage';
import ScripturePage from './pages/ScripturePage';
import BreathPrayerPage from './pages/BreathPrayerPage';

/** Applies theme and font-size data attributes to <html> based on user profile */
function ThemeApplier() {
  const { profile } = useAuth();

  useEffect(() => {
    const theme = profile?.theme ?? 'light';
    const fontSize = profile?.font_size ?? 'base';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-fontsize', fontSize);
  }, [profile]);

  return null;
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulsate-bck opacity-50">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" />;

  if (!profile && window.location.hash !== '#/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
      <Route path="/scripture" element={<ProtectedRoute><ScripturePage /></ProtectedRoute>} />
      <Route path="/breath" element={<ProtectedRoute><BreathPrayerPage /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ThemeApplier />
        <div className="min-h-screen font-sans antialiased transition-colors duration-400">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
