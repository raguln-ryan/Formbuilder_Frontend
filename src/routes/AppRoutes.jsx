import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Import all your pages
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import AdminDashboard from '../pages/AdminDashboard';
import LearnerDashboard from '../pages/LearnerDashboard';
import FormEditorPage from '../pages/FormEditorPage';
import ViewFormPage from '../pages/ViewFormPage';
import FormSubmissionPage from '../pages/FormSubmissionPage';
import PublicFormPage from '../pages/PublicFormPage';
import SubmissionView from '../components/Learner/SubmissionView';
// Protected Route Component
import ProtectedRoute from '../components/Auth/ProtectedRoute';

const AppRoutes = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        isAuthenticated ? (
          user?.role === 'Admin' ? <Navigate to="/admin" /> : <Navigate to="/learner/dashboard" />
        ) : (
          <LoginPage />
        )
      } />
      
      <Route path="/register" element={
        isAuthenticated ? (
          user?.role === 'Admin' ? <Navigate to="/admin" /> : <Navigate to="/learner/dashboard" />
        ) : (
          <RegisterPage />
        )
      } />

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/form/new" element={<FormEditorPage />} />
        <Route path="/form/:id/edit" element={<FormEditorPage />} />
        <Route path="/form/:formId/view" element={<ViewFormPage />} />
      </Route>

      {/* Protected Learner Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Learner']} />}>
        <Route path="/learner/dashboard" element={<LearnerDashboard />} />
        <Route path="/form/:formId/submission" element={<FormSubmissionPage />} />
        <Route path="/submission/:submissionId/view" element={<SubmissionView />} />
        <Route path="/form/:formId/public" element={<PublicFormPage />} />
      </Route>

      {/* Default Route */}
      <Route path="/" element={
        isAuthenticated ? (
          user?.role === 'Admin' ? (
            <Navigate to="/admin" replace />
          ) : (
            <Navigate to="/learner/dashboard" replace />
          )
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* 404 Route */}
      <Route path="*" element={
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh' 
        }}>
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <button onClick={() => window.location.href = '/'}>
            Go to Home
          </button>
        </div>
      } />
    </Routes>
  );
};

export default AppRoutes;