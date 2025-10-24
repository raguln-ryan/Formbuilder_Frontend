import React from 'react';
import FormList from '../components/FormBuilder/FormList';
import '../styles/pages/AdminDashboard.css';

import NavigationBar from '@components/Common/NavigationBar';

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <NavigationBar pageName="Form Builder" />
      <FormList />
    </div>
  );
};

export default AdminDashboard;
