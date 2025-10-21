import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import FormEditorPage from './pages/FormEditorPage';
import ResponsesPage from './pages/ResponsesPage';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/form/:id/edit" element={<FormEditorPage />} />
          <Route path="/form/new" element={<FormEditorPage />} />
          <Route path="/responses/:formId" element={<ResponsesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
