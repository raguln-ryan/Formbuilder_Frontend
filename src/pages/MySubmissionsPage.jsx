import React from 'react';
import MySubmissions from '../components/Learner/MySubmissions';
import '../styles/pages/MySubmissionsPage.css';

const MySubmissionsPage = () => {
  return (
    <div className="my-submissions-page">
      <div className="page-header">
        <h1>My Submissions</h1>
        <p>View all your form submissions and responses</p>
      </div>
      <div className="page-content">
        <MySubmissions />
      </div>
    </div>
  );
};

export default MySubmissionsPage;