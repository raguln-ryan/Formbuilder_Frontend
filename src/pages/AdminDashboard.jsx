import React from 'react';
import FormList from '../components/FormBuilder/FormList';
import '../styles/pages/AdminDashboard.css';

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Form Builder Dashboard</h1>
        <p>Manage your forms and view responses</p>
      </div>
      <FormList />
    </div>
  );
};

export default AdminDashboard;
