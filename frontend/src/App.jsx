import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import RootLayout from './layouts/RootLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MyPollsPage from './pages/MyPollsPage';
import CreatePollPage from './pages/CreatePollPage';
import PublicPollPage from './pages/PublicPollPage';
import PollResultsPage from './pages/PollResultsPage';
import PollAnalyticsPage from './pages/PollAnalyticsPage';
import DemoPollPage from './pages/DemoPollPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Layout Routes */}
            <Route element={<RootLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/demo" element={<DemoPollPage />} />
              <Route path="/poll/:pollId" element={<PublicPollPage />} />
              <Route path="/poll/:pollId/results" element={<PollResultsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Authenticated Dashboard Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/polls" element={<MyPollsPage />} />
              <Route path="/dashboard/analytics" element={<MyPollsPage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
              <Route path="/polls/create" element={<CreatePollPage />} />
              <Route path="/polls/:id/analytics" element={<PollAnalyticsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
