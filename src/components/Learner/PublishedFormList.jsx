import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import responseService from '../../services/responseService';
import LoadingSpinner from '../Common/LoadingSpinner';
import NavigationBar from '../Common/NavigationBar';
import toast from 'react-hot-toast';
import '../../styles/components/Learner/PublishedFormList.css';
import searchIcon from '../../assets/Ellipse.png';

const PublishedFormList = () => {
  const [activeTab, setActiveTab] = useState('published');
  const [forms, setForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Learner') {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (activeTab === 'published') {
      fetchPublishedForms();
    } else {
      fetchMySubmissions();
    }
  }, [activeTab]);

  useEffect(() => {
    const filtered = forms.filter((form) =>
      form.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredForms(filtered);
  }, [searchTerm, forms]);

  const fetchPublishedForms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await responseService.getPublishedForms();
      
      if (Array.isArray(response)) {
        setForms(response);
        setFilteredForms(response);
      } else {
        setForms([]);
        setFilteredForms([]);
      }
    } catch (err) {
      toast.error('Error loading forms: ' + (err.message || ''));
      setError('Failed to load forms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all user's submissions
      const response = await responseService.getMySubmissions();
      
      if (Array.isArray(response)) {
        setMySubmissions(response);
      } else {
        setMySubmissions([]);
      }
    } catch (err) {
      console.log('No submissions yet');
      setMySubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = (formId) => {
    console.log('Navigating to form submission with ID:', formId); // Debug log
    navigate(`/form/${formId}/submission`);
  };

  const handleViewSubmission = (submissionId) => {
    navigate(`/submission/${submissionId}/view`);
  };

  const formatDueDate = (date) => {
    if (!date) return 'No due date';
    const dueDate = new Date(date);
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span className="due-date overdue">Overdue</span>;
    } else if (diffDays === 0) {
      return <span className="due-date today">Due Today</span>;
    } else if (diffDays <= 7) {
      return <span className="due-date soon">Due in {diffDays} days</span>;
    } else {
      return <span className="due-date">Due: {dueDate.toLocaleDateString()}</span>;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="published-form-page">
      <NavigationBar />
      
      <div className="learner-tabs-container">
        <div className="learner-tabs-wrapper">
          <div className="learner-tabs">
            <button
              className={`learner-tab ${activeTab === 'published' ? 'active' : ''}`}
              onClick={() => setActiveTab('published')}
            >
              Published Forms
              {activeTab === 'published' && <div className="tab-indicator"></div>}
            </button>
            <button
              className={`learner-tab ${activeTab === 'submissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('submissions')}
            >
              My Submissions
              {activeTab === 'submissions' && <div className="tab-indicator"></div>}
            </button>
          </div>
        </div>
      </div>

      <div className="published-form-list-container">
        {activeTab === 'published' ? (
          // Published Forms Tab Content
          error ? (
            <div className="error-state">
              <h3>Error</h3>
              <p>{error}</p>
              <button onClick={fetchPublishedForms} className="retry-btn">
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="published-form-list-header">
                <h2>Available Forms</h2>
                <div className="search-bar">
                  <img src={searchIcon} alt="Search" className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search forms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-search-input"
                  />
                </div>
              </div>

              {filteredForms.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <h3>No forms available</h3>
                  <p>{searchTerm ? 'No forms match your search' : 'No published forms available at the moment'}</p>
                </div>
              ) : (
                <div className="form-grid">
                  {filteredForms.map((form) => (
                    <div key={form.formId || form.id} className="published-form-card">
                      <div className="published-form-card-content">
                        <div className="published-form-details">
                          <h3 className="published-form-title">{form.title || 'Untitled Form'}</h3>
                          <p className="published-form-description">
                            {form.description || 'No description available'}
                          </p>
                          <div className="published-form-meta">
                            {formatDueDate(form.dueDate)}
                            {form.questions && (
                              <span className="questions-count">
                                {form.questions.length} questions
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="published-form-card-footer">
                          <button
                            className="submit-response-btn"
                            onClick={() => handleSubmitResponse(form.formId || form.id)}
                          >
                            Submit Response
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )
        ) : (
          // My Submissions Tab Content
          <>
            <div className="published-form-list-header">
              <h2>My Submissions</h2>
            </div>

            {mySubmissions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <h3>No submissions yet</h3>
                <p>You haven't submitted any forms yet. Start by submitting a form from the Published Forms tab.</p>
                <button
                  className="submit-now-btn"
                  onClick={() => setActiveTab('published')}
                >
                  View Published Forms
                </button>
              </div>
            ) : (
              <div className="submissions-grid">
                {mySubmissions.map((submission) => (
                  <div key={submission.id} className="submission-card">
                    <div className="submission-card-content">
                      <div className="submission-info">
                        <h4 className="submission-form-title">{submission.formTitle || 'Form Submission'}</h4>
                        <div className="submission-meta">
                          <span className="submission-id">ID: #{submission.id}</span>
                          <span className="submission-date">
                            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="submission-card-footer">
                        <span className="status-badge submitted">Submitted</span>
                        <button
                          className="view-submission-btn"
                          onClick={() => handleViewSubmission(submission.id)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PublishedFormList;
