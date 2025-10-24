import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import responseService from '../../services/responseService';
import LoadingSpinner from '../Common/LoadingSpinner';
import '../../styles/components/Responses/FormResponses.css';

const FormResponses = ({ formId }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formDetails, setFormDetails] = useState(null);
  const [expandedResponse, setExpandedResponse] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Admin') {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (formId) {
      fetchFormAndResponses();
    }
  }, [formId]);

  const fetchFormAndResponses = async () => {
    try {
      setLoading(true);
      
      // Get form details from localStorage
      const publishedForms = JSON.parse(localStorage.getItem('published_forms') || '[]');
      const form = publishedForms.find(f => f.formId === formId);
      
      if (form) {
        setFormDetails(form);
      }
      
      // Get responses
      const formResponses = await responseService.getFormResponses(formId);
      console.log('Fetched responses:', formResponses);
      setResponses(formResponses || []);
    } catch (error) {
      console.error('Error fetching responses:', error);
      setResponses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    await responseService.exportToCSV(formId);
  };

  const toggleResponseDetails = (responseId) => {
    setExpandedResponse(expandedResponse === responseId ? null : responseId);
  };

  const getQuestionText = (questionId) => {
    if (!formDetails || !formDetails.questions) return questionId;
    const question = formDetails.questions.find(q => q.id === questionId);
    return question?.text || question?.label || question?.question || questionId;
  };

  if (loading) {
    return <LoadingSpinner message="Loading responses..." />;
  }

  return (
    <div className="form-responses-container">
      <div className="responses-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/admin')}>
            ← Back to Dashboard
          </button>
          <h1>Form Responses</h1>
          {formDetails && (
            <div className="form-info">
              <h2>{formDetails.title}</h2>
              <p>{formDetails.description}</p>
            </div>
          )}
        </div>
        <div className="header-actions">
          <span className="response-count">
            Total Responses: {responses.length}
          </span>
          <button 
            className="export-button"
            onClick={handleExportCSV}
            disabled={responses.length === 0}
          >
            📥 Export to CSV
          </button>
        </div>
      </div>

      {responses.length === 0 ? (
        <div className="no-responses">
          <div className="empty-icon">📭</div>
          <h3>No responses yet</h3>
          <p>Share your form to start collecting responses</p>
          <button 
            className="share-form-btn"
            onClick={() => {
              const publicUrl = `${window.location.origin}/form/${formId}`;
              navigator.clipboard.writeText(publicUrl);
              alert(`Form link copied!\n${publicUrl}`);
            }}
          >
            📤 Copy Form Link
          </button>
        </div>
      ) : (
        <div className="responses-list">
          <div className="responses-table">
            <div className="table-header">
              <div className="header-cell">Respondent</div>
              <div className="header-cell">Email</div>
              <div className="header-cell">Submitted At</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Actions</div>
            </div>
            {responses.map((response) => (
              <React.Fragment key={response.id}>
                <div className="table-row">
                  <div className="table-cell">
                    <strong>{response.user?.name || 'Anonymous'}</strong>
                    <div className="user-role">{response.user?.role || 'Guest'}</div>
                  </div>
                  <div className="table-cell">{response.user?.email || 'N/A'}</div>
                  <div className="table-cell">
                    {new Date(response.submittedAt).toLocaleString()}
                  </div>
                  <div className="table-cell">
                    <span className={`status-badge status-${response.status || 'completed'}`}>
                      {response.status || 'Completed'}
                    </span>
                  </div>
                  <div className="table-cell">
                    <button
                      className="view-details-btn"
                      onClick={() => toggleResponseDetails(response.id)}
                    >
                      {expandedResponse === response.id ? '▼ Hide' : '▶ View'} Details
                    </button>
                  </div>
                </div>
                {expandedResponse === response.id && (
                  <div className="response-details">
                    <div className="details-content">
                      <h4>Response Details</h4>
                      {response.details && response.details.map((detail, idx) => (
                        <div key={idx} className="detail-item">
                          <div className="detail-question">
                            {getQuestionText(detail.questionId)}:
                          </div>
                          <div className="detail-answer">
                            {detail.answer || 'No answer provided'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormResponses;