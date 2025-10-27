import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import responseService from '../../services/responseService';
import LoadingSpinner from '../Common/LoadingSpinner';
import NavigationBar from '../Common/NavigationBar';
import toast from 'react-hot-toast';
import { FiSearch, FiFilter, FiFileText } from 'react-icons/fi';
import '../../styles/components/Learner/PublishedFormList.css';
import searchIcon from '../../assets/Ellipse.png';

const PublishedFormList = () => {
  const [activeTab, setActiveTab] = useState('published');
  const [forms, setForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [submissionSearchTerm, setSubmissionSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('External Training Completion');
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
    console.log('Navigating to form submission with ID:', formId);
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

  const formatSubmissionDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' at ' + d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusDisplay = (status) => {
    if (status === 'approved') return 'Completion Approved';
    if (status === 'rejected') return 'Completion Rejected';
    return 'Completion Submitted';
  };

  const getStatusClass = (status) => {
    if (status === 'approved') return 'approved';
    if (status === 'rejected') return 'rejected';
    return 'submitted';
  };

  // Filter submissions based on search
  const filteredSubmissions = mySubmissions.filter((submission) =>
    submission.formTitle?.toLowerCase().includes(submissionSearchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

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
          // Published Forms Tab Content (unchanged)
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
          // My Submissions Tab - Table Format
          <div className="submission-table-container">
            <div className="submission-table-header">
              <select
                className="submission-dropdown"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>External Training Completion</option>
                <option>All Forms</option>
              </select>
              <div className="submission-controls">
                <div className="submission-search-bar">
                  <FiSearch className="submission-search-icon" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={submissionSearchTerm}
                    onChange={(e) => setSubmissionSearchTerm(e.target.value)}
                  />
                </div>
                <button className="submission-filter-btn">
                  <FiFilter /> Filter
                </button>
              </div>
            </div>

            {filteredSubmissions.length === 0 ? (
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
              <>
                {/* Table */}
                <div className="submission-table-wrapper">
                  <table className="submission-table">
                    <thead>
                      <tr>
                        <th>Form Name</th>
                        <th>Submitted On</th>
                        <th>Form Type</th>
                        <th>Status</th>
                        <th>Responses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSubmissions.map((submission) => (
                        <tr key={submission.id}>
                          <td>{submission.formTitle || 'External Training'}</td>
                          <td>{formatSubmissionDate(submission.submittedAt)}</td>
                          <td>
                            <span className="submission-form-type">External Training Completion</span>
                          </td>
                          <td>
                            <span className={`submission-status ${getStatusClass(submission.status)}`}>
                              {getStatusDisplay(submission.status)}
                            </span>
                          </td>
                          <td>
                            <button
                              className="submission-action-btn"
                              onClick={() => handleViewSubmission(submission.id)}
                              title="View Details"
                            >
                              <FiFileText />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="submission-pagination">
                  <div className="pagination-left">
                    <label>Items per page</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span>{startIndex + 1}–{Math.min(endIndex, filteredSubmissions.length)} of {filteredSubmissions.length} items</span>
                  </div>
                  <div className="pagination-right">
                    <span>{currentPage} of {totalPages} pages</span>
                    <button
                      className="pagination-page-btn"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      &lt;
                    </button>
                    <button
                        className={`pagination-page-btn ${currentPage !== totalPages ? 'active' : ''}`}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        &gt;
                      </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishedFormList;
