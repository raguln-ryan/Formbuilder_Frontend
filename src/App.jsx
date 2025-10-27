import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import LearnerDashboard from './pages/LearnerDashboard';
import FormEditorPage from './pages/FormEditorPage';
import ViewFormPage from './pages/ViewFormPage';
import FormSubmissionPage from './pages/FormSubmissionPage';
import FormSubmission from './components/Learner/FormSubmission';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#4caf50',
              },
            },
            error: {
              style: {
                background: '#f44336',
              },
            },
          }}
        />
        <Routes>
          {/* Public Routes - No authentication required */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/form/new"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <FormEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/form/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <FormEditorPage />
              </ProtectedRoute>
            }
          />
          
          {/* Learner Protected Routes */}
          <Route
            path="/learner/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Learner']}>
                <LearnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learner/forms"
            element={
              <ProtectedRoute allowedRoles={['Learner']}>
                <LearnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/form/:formId/submission"
            element={
              <ProtectedRoute allowedRoles={['Learner']}>
                <FormSubmission />
              </ProtectedRoute>
            }
          />
          
          {/* Shared Routes */}
          <Route path="/form/:formId/view" element={<ViewFormPage />} />
          
          {/* Root path - redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
