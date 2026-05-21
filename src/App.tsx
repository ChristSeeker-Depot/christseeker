import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Lazily load every page so Vite splits each into its own chunk.
// This reduces the initial JS bundle from ~970 KB to ~150-200 KB.
const AuthPage           = lazy(() => import('./pages/AuthPage'));
const OnboardingPage     = lazy(() => import('./pages/OnboardingPage'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const ChatPage           = lazy(() => import('./pages/ChatPage'));
const SettingsPage       = lazy(() => import('./pages/SettingsPage'));
const JournalPage        = lazy(() => import('./pages/JournalPage'));
const ScripturePage      = lazy(() => import('./pages/ScripturePage'));
const BreathPrayerPage   = lazy(() => import('./pages/BreathPrayerPage'));
const PrayerWallPage     = lazy(() => import('./pages/PrayerWallPage'));
const SermonNotesPage    = lazy(() => import('./pages/SermonNotesPage'));
const SermonLivePage     = lazy(() => import('./pages/SermonLivePage'));
const DevotionalPage     = lazy(() => import('./pages/DevotionalPage'));
const ReadingPlansPage   = lazy(() => import('./pages/ReadingPlansPage'));
const StrongholdBusterPage = lazy(() => import('./pages/StrongholdBusterPage'));
const PrivacyPolicyPage  = lazy(() => import('./pages/PrivacyPolicyPage'));
const SupportPage        = lazy(() => import('./pages/SupportPage'));
const BugReportPage      = lazy(() => import('./pages/BugReportPage'));
const FastingTrackerPage = lazy(() => import('./pages/FastingTrackerPage'));
const SmallGroupsPage    = lazy(() => import('./pages/SmallGroupsPage'));
const SermonArchivePage  = lazy(() => import('./pages/SermonArchivePage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));

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

// Simple fallback shown while a lazy page chunk is being fetched
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulsate-bck opacity-50">Loading...</div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/auth"         element={<AuthPage />} />
        <Route path="/onboarding"   element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/"             element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/chat"         element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/settings"     element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/journal"      element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
        <Route path="/scripture"    element={<ProtectedRoute><ScripturePage /></ProtectedRoute>} />
        <Route path="/breath"       element={<ProtectedRoute><BreathPrayerPage /></ProtectedRoute>} />
        <Route path="/prayer-wall"  element={<ProtectedRoute><PrayerWallPage /></ProtectedRoute>} />
        <Route path="/sermon-notes" element={<ProtectedRoute><SermonNotesPage /></ProtectedRoute>} />
        <Route path="/sermon-live"  element={<ProtectedRoute><SermonLivePage /></ProtectedRoute>} />
        <Route path="/devotional"   element={<ProtectedRoute><DevotionalPage /></ProtectedRoute>} />
        <Route path="/plans"        element={<ProtectedRoute><ReadingPlansPage /></ProtectedRoute>} />
        <Route path="/stronghold"   element={<ProtectedRoute><StrongholdBusterPage /></ProtectedRoute>} />
        <Route path="/privacy"      element={<PrivacyPolicyPage />} />
        <Route path="/support"      element={<SupportPage />} />
        <Route path="/bug-report"   element={<ProtectedRoute><BugReportPage /></ProtectedRoute>} />
        <Route path="/fasting"      element={<ProtectedRoute><FastingTrackerPage /></ProtectedRoute>} />
        <Route path="/groups"       element={<ProtectedRoute><SmallGroupsPage /></ProtectedRoute>} />
        <Route path="/archives"     element={<ProtectedRoute><SermonArchivePage /></ProtectedRoute>} />
        <Route path="/admin"        element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ThemeApplier />
          <div className="min-h-screen font-sans antialiased transition-colors duration-400">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
