import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppNavbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ClubDashboard } from './pages/ClubDashboard';
import { CoachDashboard } from './pages/CoachDashboard';
import { DiscoverPage } from './pages/DiscoverPage';
import { CoversPage } from './pages/CoversPage';
import { Container } from 'react-bootstrap';

// Protected Route Guards
const ClubRoute = ({ children }) => {
  const { isAuthenticated, isClub, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || !isClub) return <Navigate to="/login" replace />;
  return children;
};

const CoachRoute = ({ children }) => {
  const { isAuthenticated, isCoach, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || !isCoach) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <AppNavbar />
          <main className="flex-grow-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/covers" element={<CoversPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/club/dashboard"
                element={
                  <ClubRoute>
                    <ClubDashboard />
                  </ClubRoute>
                }
              />
              <Route
                path="/coach/dashboard"
                element={
                  <CoachRoute>
                    <CoachDashboard />
                  </CoachRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="py-4 bg-white border-top text-center text-muted small mt-auto">
            <Container>
              <p className="mb-1">
                <span className="brand-gradient fw-bold">coverMe</span> — Gymnastics Coach Availability & Class Cover Platform
              </p>
              <p className="mb-0 text-secondary" style={{ fontSize: '0.8rem' }}>
                Built on Scalable Enterprise Domain Architecture • Prepared for Multi-Sports & Universal Expansion
              </p>
            </Container>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
