import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import responseService from '../../services/responseService';
import LoadingSpinner from '../Common/LoadingSpinner';
import NavigationBar from '../Common/NavigationBar';
import toast from 'react-hot-toast';
import { FiSearch, FiFilter, FiFileText } from 'react-icons/fi';
import '../../styles/components/Learner/PublishedFormList.css';
import searchIcon from '../../assets/Ellipse.png';
import Modal from '../Common/Modal';
import { debounce } from 'lodash';
import jilo from '../../assets/jilo.png';
const PublishedFormList = () => {
  const [activeTab, setActiveTab] = useState('published');
  const [forms, setForms] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [submissionSearchTerm, setSubmissionSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination states for published forms
  const [formsPage, setFormsPage] = useState(1);
  const [formsPageSize, setFormsPageSize] = useState(10);
  const [formsTotalCount, setFormsTotalCount] = useState(0);
  const [formsTotalPages, setFormsTotalPages] = useState(0);
  
  // Pagination states for submissions
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [submissionsPageSize, setSubmissionsPageSize] = useState(10);
  const [submissionsTotalCount, setSubmissionsTotalCount] = useState(0);
  const [submissionsTotalPages, setSubmissionsTotalPages] = useState(0);
  
  const [statusFilter, setStatusFilter] = useState('External Training Completion');
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);
  const [lastSubmissionDate, setLastSubmissionDate] = useState(null);
  const [selectedFormId, setSelectedFormId] = useState(null);
  
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
  }, [activeTab, formsPage, formsPageSize, submissionsPage, submissionsPageSize]);

  // Debounced search for published forms
  const debouncedFormsSearch = useCallback(
    debounce((searchValue) => {
      setFormsPage(1); // Reset to first page on search
      fetchPublishedForms(1, formsPageSize, searchValue);
    }, 500),
    [formsPageSize]
  );

  // Debounced search for submissions
  const debouncedSubmissionsSearch = useCallback(
    debounce((searchValue) => {
      setSubmissionsPage(1); // Reset to first page on search
      fetchMySubmissions(1, submissionsPageSize, searchValue);
    }, 500),
    [submissionsPageSize]
  );

  const handleFormsSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedFormsSearch(value);
  };

  const handleSubmissionsSearchChange = (e) => {
    const value = e.target.value;
    setSubmissionSearchTerm(value);
    debouncedSubmissionsSearch(value);
  };

  const fetchPublishedForms = async (page = formsPage, size = formsPageSize, search = searchTerm) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await responseService.getPublishedForms(page, size, search);
      console.log('Published forms response:', response);

      if (response && response.data) {
        setForms(response.data);
        setFormsTotalCount(response.totalCount || 0);
        setFormsTotalPages(response.totalPages || Math.ceil(response.totalCount / size));
      } else if (Array.isArray(response)) {
        // Fallback for array response
        setForms(response);
        setFormsTotalCount(response.length);
        setFormsTotalPages(1);
      } else {
        setForms([]);
        setFormsTotalCount(0);
        setFormsTotalPages(0);
      }
    } catch (err) {
      console.error('Error loading forms:', err);
      toast.error('Error loading forms: ' + (err.message || ''));
      setError('Failed to load forms. Please try again.');
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubmissions = async (page = submissionsPage, size = submissionsPageSize, search = submissionSearchTerm) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await responseService.getMySubmissions(page, size, search);
      console.log('My submissions response:', response);

      if (response && response.data) {
        setMySubmissions(response.data);
        setSubmissionsTotalCount(response.totalCount || 0);
        setSubmissionsTotalPages(response.totalPages || Math.ceil(response.totalCount / size));
      } else if (Array.isArray(response)) {
        // Fallback for array response
        setMySubmissions(response);
        setSubmissionsTotalCount(response.length);
        setSubmissionsTotalPages(1);
      } else {
        setMySubmissions([]);
        setSubmissionsTotalCount(0);
        setSubmissionsTotalPages(0);
      }
    } catch (err) {
      console.log('No submissions yet');
      setMySubmissions([]);
      setSubmissionsTotalCount(0);
      setSubmissionsTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async (formId) => {
    try {
      const submissions = await responseService.getMySubmissions(1, 100, '');
      const submissionsList = submissions.data || submissions || [];

      const existingSubmission = submissionsList.find(
        submission => (submission.formId === formId ||
          submission.form_id === formId ||
          submission.form?.id === formId ||
          submission.form?.formId === formId)
      );

      if (existingSubmission) {
        setSelectedFormId(formId);
        setLastSubmissionDate(existingSubmission.submittedAt || existingSubmission.submitted_at);
        setShowSubmittedModal(true);
      } else {
        console.log('Navigating to form submission with ID:', formId);
        navigate(`/form/${formId}/submission`);
      }
    } catch (error) {
      console.error('Error checking submissions:', error);
      navigate(`/form/${formId}/submission`);
    }
  };

  const handleContinueSubmission = () => {
    setShowSubmittedModal(false);
    if (selectedFormId) {
      navigate(`/form/${selectedFormId}/submission`);
    }
  };

  const handleViewSubmission = (submission) => {
    navigate(`/submission/${submission.id}/view`, {
      state: { submission }
    });
  };

  const formatDueDate = (date) => {
    if (!date) return '';
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
              Self-Service Forms
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
          // Published Forms Tab
          error ? (
            <div className="error-state">
              <h3>Error</h3>
              <p>{error}</p>
              <button onClick={() => fetchPublishedForms()} className="retry-btn">
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="published-form-list-header">
                <div className = "text-container">
                  <div className="jilo-icon-container"> 
                    <img src={jilo} alt="Jilo" className="jilo-icon" />
                  </div>
                  <p>These forms are optional and can be submitted multiple times if needed.</p>
                </div>
                <div className="search-bar">
                  <img src={searchIcon} alt="Search" className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={handleFormsSearchChange}
                    className="form-search-input"
                  />
                 
                </div>
              </div>

              

              {forms.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <h3>No forms available</h3>
                  <p>{searchTerm ? 'No forms match your search' : 'No published forms available at the moment'}</p>
                </div>
              ) : (
                <>
                  <div className="form-grid">
                    {forms.map((form) => (
                      <div key={form.formId || form.id} className="published-form-card">
                        <div className="published-form-card-content">
                          <div className="published-form-details">
                            <h3 className="published-form-title">{form.title || 'Untitled Form'}</h3>
                            <p className="published-form-description">
                              {form.description || 'No description available'}
                            </p>
                            <div className="published-form-meta">
                              {formatDueDate(form.dueDate)}
                              {form.createdAt && (
                                <span className="created-date">
                                  Created: {new Date(form.createdAt).toLocaleDateString('en-US', {
                                    month: '2-digit',
                                    day: '2-digit',
                                    year: 'numeric'
                                  })}
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

                  {/* Pagination for Published Forms */}
                  {formsTotalPages > 1 && (
                    <div className="pagination-container">
                      <div className="pagination-info">
                        <span>
                          Showing {((formsPage - 1) * formsPageSize) + 1} - {Math.min(formsPage * formsPageSize, formsTotalCount)} of {formsTotalCount} forms
                        </span>
                        <div className="items-per-page">
                          <label>Items per page:</label>
                          <select 
                            value={formsPageSize} 
                            onChange={(e) => {
                              setFormsPageSize(Number(e.target.value));
                              setFormsPage(1);
                            }}
                            className="items-per-page-select"
                          >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                          </select>
                        </div>
                      </div>

                      <div className="pagination-controls">
                        <button 
                          className="pagination-btn"
                          onClick={() => setFormsPage(prev => Math.max(1, prev - 1))}
                          disabled={formsPage === 1}
                        >
                          ←
                        </button>
                        <span className="page-info">
                          Page {formsPage} of {formsTotalPages}
                        </span>
                        <button 
                          className="pagination-btn"
                          onClick={() => setFormsPage(prev => Math.min(formsTotalPages, prev + 1))}
                          disabled={formsPage === formsTotalPages}
                        >
                          →
                        </button>
                      </div>
                    </div>
                  )}
                </>
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
                    placeholder="Search submissions..."
                    value={submissionSearchTerm}
                    onChange={handleSubmissionsSearchChange}
                  />
                 
                </div>
                <button className="submission-filter-btn">
                  <FiFilter /> Filter
                </button>
              </div>
            </div>

            {submissionSearchTerm && (
              <div className="search-info">
                Found {submissionsTotalCount} submission{submissionsTotalCount !== 1 ? 's' : ''} for "{submissionSearchTerm}"
              </div>
            )}

            {mySubmissions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <h3>No submissions yet</h3>
                <p>
                  {submissionSearchTerm 
                    ? `No submissions match your search "${submissionSearchTerm}"`
                    : "You haven't submitted any forms yet. Start by submitting a form from the Published Forms tab."}
                </p>
                {!submissionSearchTerm && (
                  <button
                    className="submit-now-btn"
                    onClick={() => setActiveTab('published')}
                  >
                    View Published Forms
                  </button>
                )}
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
                      {mySubmissions.map((submission) => (
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
                              onClick={() => handleViewSubmission(submission)}
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

                {/* Pagination for Submissions */}
                {submissionsTotalPages > 1 && (
                  <div className="submission-pagination">
                    <div className="pagination-left">
                      <label>Items per page</label>
                      <select
                        value={submissionsPageSize}
                        onChange={(e) => {
                          setSubmissionsPageSize(Number(e.target.value));
                          setSubmissionsPage(1);
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                      <span>
                        {((submissionsPage - 1) * submissionsPageSize) + 1}–
                        {Math.min(submissionsPage * submissionsPageSize, submissionsTotalCount)} of {submissionsTotalCount} items
                      </span>
                    </div>
                    <div className="pagination-right">
                      <span>{submissionsPage} of {submissionsTotalPages} pages</span>
                      <button
                        className="pagination-page-btn"
                        onClick={() => setSubmissionsPage(prev => Math.max(1, prev - 1))}
                        disabled={submissionsPage === 1}
                      >
                        ←
                      </button>
                      <button
                        className="pagination-page-btn"
                        onClick={() => setSubmissionsPage(prev => Math.min(submissionsTotalPages, prev + 1))}
                        disabled={submissionsPage === submissionsTotalPages}
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Already Submitted Modal */}
      <Modal
        isOpen={showSubmittedModal}
        onClose={() => {
          setShowSubmittedModal(false);
          setSelectedFormId(null);
          setLastSubmissionDate(null);
        }}
        onConfirm={handleContinueSubmission}
        type="submitted"
        lastSubmissionDate={lastSubmissionDate}
      />
    </div>
  );
};

export default PublishedFormList;
