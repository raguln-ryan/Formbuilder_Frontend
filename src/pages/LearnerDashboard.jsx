import React, { useState } from 'react';
import PublishedFormList from '../components/Learner/PublishedFormList';
import MySubmissions from '../components/Learner/MySubmissions';
import '../styles/pages/LearnerDashboard.css';

const LearnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('forms');

  return (
    <div className="learner-dashboard">
      <div className="dashboard-header">
        <h1>Learner Dashboard</h1>
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'forms' ? 'active' : ''}`}
            onClick={() => setActiveTab('forms')}
          >
            Published Forms
          </button>
          <button
            className={`tab-btn ${activeTab === 'submissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('submissions')}
          >
            My Submissions
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === 'forms' ? (
          <PublishedFormList />
        ) : (
          <MySubmissions />
        )}
      </div>
    </div>
  );
};

export default LearnerDashboard;