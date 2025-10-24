import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/components/Responses/ResponseSummary.css';

const ResponseSummary = ({ responses, formDetails, onViewResponse }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Authentication check
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Admin') {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);
  
  // Calculate statistics
  const stats = {
    total: responses.length,
    completed: responses.filter(r => (r.status || 'completed') === 'completed').length,
    pending: responses.filter(r => r.status === 'pending').length,
    draft: responses.filter(r => r.status === 'draft').length
  };

  // Calculate completion rate
  const completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  return (
    <div className="response-summary-container">
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon total">📊</span>
            <span className="stat-label">Total Responses</span>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-footer">All submissions</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon completed">✅</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-footer">{completionRate}% of total</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon pending">⏳</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-footer">In progress</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon draft">📝</span>
            <span className="stat-label">Draft</span>
          </div>
          <div className="stat-value">{stats.draft}</div>
          <div className="stat-footer">Not submitted</div>
        </div>
      </div>

      {/* Responses Table */}
      <div className="table-container">
        <div className="table-header">
          <h3>All Responses</h3>
          <span className="table-count">Showing {responses.length} entries</span>
        </div>
        
        <div className="table-wrapper">
          <table className="responses-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Submitted By</th>
                <th>User ID</th>
                <th>Email</th>
                <th>Submitted At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {responses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-row">
                    <div className="empty-state">
                      <span className="empty-icon">📭</span>
                      <p>No responses found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                responses.map((response, index) => (
                  <tr key={response.id || index}>
                    <td className="row-number">{index + 1}</td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          {(response.user?.name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <span className="user-name">
                          {response.user?.name || 'Anonymous'}
                        </span>
                      </div>
                    </td>
                    <td className="user-id">{response.userId || 'N/A'}</td>
                    <td className="user-email">{response.user?.email || 'N/A'}</td>
                    <td className="submitted-date">
                      <div className="date">{new Date(response.submittedAt).toLocaleDateString()}</div>
                      <div className="time">{new Date(response.submittedAt).toLocaleTimeString()}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${response.status || 'completed'}`}>
                        {response.status || 'Completed'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="view-btn"
                        onClick={() => onViewResponse(response)}
                        title="View Response"
                      >
                        👁️ View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResponseSummary;