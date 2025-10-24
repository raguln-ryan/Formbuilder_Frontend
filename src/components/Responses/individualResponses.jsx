import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/components/Responses/IndividualResponses.css';

const IndividualResponses = ({ responses, formDetails, onViewResponse }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentResponses = responses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(responses.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Get completion percentage for a response
  const getCompletionPercentage = (response) => {
    if (!response.details || !formDetails?.questions) return 0;
    const answered = response.details.length;
    const total = formDetails.questions.length;
    return Math.round((answered / total) * 100);
  };

  // Get response status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'draft':
        return '#dc3545';
      default:
        return '#28a745';
    }
  };

  return (
    <div className="individual-responses-container">
      {responses.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">📭</div>
          <h3>No Responses Yet</h3>
          <p>Responses will appear here once users submit the form</p>
        </div>
      ) : (
        <>
          {/* Response Cards Grid */}
          <div className="response-cards-grid">
            {currentResponses.map((response, index) => {
              const completionRate = getCompletionPercentage(response);
              const responseNumber = indexOfFirstItem + index + 1;
              const status = response.status || 'completed';
              
              return (
                <div key={response.id || index} className="response-card">
                  <div className="card-header">
                    <div className="response-number">#{responseNumber}</div>
                    <span className={`status-badge ${status}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="card-body">
                    <div className="respondent-info">
                      <div className="user-avatar">
                        {(response.user?.name || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <h4>{response.user?.name || 'Anonymous'}</h4>
                        <p className="user-id">User ID: {response.userId}</p>
                      </div>
                    </div>
                    
                    <div className="response-meta">
                      <div className="meta-item">
                        <span className="meta-label">📧 Email:</span>
                        <span className="meta-value">{response.user?.email || 'N/A'}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">📅 Submitted:</span>
                        <span className="meta-value">
                          {response.submittedAt 
                            ? new Date(response.submittedAt).toLocaleDateString()
                            : 'Not submitted'}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">⏰ Time:</span>
                        <span className="meta-value">
                          {response.submittedAt 
                            ? new Date(response.submittedAt).toLocaleTimeString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Completion Progress */}
                    <div className="completion-section">
                      <div className="completion-header">
                        <span className="completion-label">Completion</span>
                        <span 
                          className="completion-percentage"
                          style={{ color: getStatusColor(status) }}
                        >
                          {completionRate}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${completionRate}%`,
                            background: getStatusColor(status)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-footer">
                    <button 
                      className="view-details-btn"
                      onClick={() => onViewResponse(response)}
                    >
                      👁️ View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>
              
              <div className="page-numbers">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  
                  // Show only relevant page numbers
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return <span key={pageNum} className="page-dots">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IndividualResponses;