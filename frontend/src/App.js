import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import FloatingDemoButton from './components/FloatingDemoButton';
import { preloadAllImages } from './utils/imageCache';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Team = lazy(() => import('./pages/Team'));
const Academics = lazy(() => import('./pages/Academics'));
const Contact = lazy(() => import('./pages/Contact'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminClassrooms = lazy(() => import('./pages/AdminClassrooms'));
const AdminTeachers = lazy(() => import('./pages/AdminTeachers'));
const AdminStudents = lazy(() => import('./pages/AdminStudents'));
const TeacherOnboarding = lazy(() => import('./pages/TeacherOnboarding'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

import './App.css';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isTeacherOnboarding = location.pathname === '/teacher/onboard';

  // Preload images on mount
  useEffect(() => {
    preloadAllImages();
  }, []);

  return (
    <div className="App">
      {!isAdminRoute && !isTeacherOnboarding && <Navigation />}
      <Suspense fallback={<PageLoader />}>
        <main>
          <Routes>
            {/* Public Routes - NOT wrapped in AuthProvider */}
            <Route path="/" element={<Home />} />
            <Route path="/team" element={<Team />} />
            <Route path="/academics" element={<Academics />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/teacher/onboard" element={<TeacherOnboarding />} />
            
            {/* Admin Routes - Wrapped in AuthProvider */}
            <Route 
              path="/admin/*" 
              element={
                <AuthProvider>
                  <AdminProvider>
                    <Routes>
                      <Route 
                        path="dashboard" 
                        element={
                          <AdminRoute>
                            <AdminDashboard />
                          </AdminRoute>
                        } 
                      />
                      <Route 
                        path="classrooms" 
                        element={
                        <AdminRoute>
                          <AdminClassrooms />
                        </AdminRoute>
                      } 
                    />
                    <Route 
                      path="teachers" 
                      element={
                        <AdminRoute>
                          <AdminTeachers />
                        </AdminRoute>
                      } 
                    />
                    <Route 
                      path="students" 
                      element={
                        <AdminRoute>
                          <AdminStudents />
                        </AdminRoute>
                      } 
                    />
                  </Routes>
                </AdminProvider>
              </AuthProvider>
            } 
          />
          
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </main>
      </Suspense>
      {!isAdminRoute && !isTeacherOnboarding && <Footer />}
      {!isAdminRoute && !isTeacherOnboarding && <FloatingDemoButton />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;