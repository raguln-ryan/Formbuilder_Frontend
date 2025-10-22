import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import FormEditorPage from './pages/FormEditorPage';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Admin Dashboard - Form List */}
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Form Editor - Create New */}
          <Route path="/form/new" element={<FormEditorPage />} />
          
          {/* Form Editor - Edit Existing */}
          <Route path="/form/:id/edit" element={<FormEditorPage />} />
          
          {/* Default redirect to admin */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
