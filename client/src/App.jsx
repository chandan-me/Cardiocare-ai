import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardOverview from './pages/DashboardOverview';
import PredictionForm from './pages/PredictionForm';
import PredictionResult from './pages/PredictionResult';
import PredictionHistory from './pages/PredictionHistory';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Simulator from './pages/Simulator';
import Toolkit from './pages/Toolkit';
import Assistant from './pages/Assistant';
import Patients from './pages/Patients';
import AuditLogs from './pages/AuditLogs';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard Index */}
              <Route index element={<DashboardOverview />} />
              {/* Predictions */}
              <Route path="predict" element={<PredictionForm />} />
              <Route path="predict/result" element={<PredictionResult />} />
              {/* History */}
              <Route path="history" element={<PredictionHistory />} />
              {/* Profile & Settings */}
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              {/* Tools & Simulators */}
              <Route path="simulator" element={<Simulator />} />
              <Route path="toolkit" element={<Toolkit />} />
              <Route path="assistant" element={<Assistant />} />
              <Route path="patients" element={<Patients />} />
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>

            {/* Fallback 404 */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
