import React, { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import NavigationBar from '../Common/NavigationBar';
import Modal from '../Common/Modal';
import toast from 'react-hot-toast';
import { FiSearch, FiFilter, FiFileText } from 'react-icons/fi';
import { debounce } from 'lodash';
import '../../styles/components/Learner/PublishedFormList.css';
import searchIcon from '../../assets/Ellipse.png';
import jilo from '../../assets/jilo.png';

// Import Redux actions and selectors
import {
  fetchPublishedForms,
  fetchMySubmissions,
  checkExistingSubmission,
  setActiveTab,
  setPublishedFormsPage,
  setPublishedFormsPageSize,
  setPublishedFormsSearchTerm,
  setSubmissionsPage,
  setSubmissionsPageSize,
  setSubmissionsSearchTerm,
  setSubmissionsFilter,
  setCurrentSubmission,
  selectPublishedForms,
  selectMySubmissions,
  selectActiveTab,
  selectExistingSubmissionCheck
} from '../../store/slices/learnerSlice';

const PublishedFormList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Redux selectors
  const activeTab = useSelector(selectActiveTab);
  const publishedForms = useSelector(selectPublishedForms);
  const mySubmissions = useSelector(selectMySubmissions);
  const existingSubmissionCheck = useSelector(selectExistingSubmissionCheck);

  // Local state for modals only
  const [showSubmittedModal, setShowSubmittedModal] = React.useState(false);
  const [lastSubmissionDate, setLastSubmissionDate] = React.useState(null);
  const [selectedFormId, setSelectedFormId] = React.useState(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Learner') {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (location.state?.activeTab) {
      dispatch(setActiveTab(location.state.activeTab));
    }
  }, [location.state, dispatch]);

  useEffect(() => {
    if (activeTab === 'published') {
      dispatch(fetchPublishedForms({
        page: publishedForms.pagination.page,
        size: publishedForms.pagination.pageSize,
        search: publishedForms.searchTerm
      }));
    } else {
      dispatch(fetchMySubmissions({
        page: mySubmissions.pagination.page,
        size: mySubmissions.pagination.pageSize,
        search: mySubmissions.searchTerm
      }));
    }
  }, [
    activeTab,
    publishedForms.pagination.page,
    publishedForms.pagination.pageSize,
    mySubmissions.pagination.page,
    mySubmissions.pagination.pageSize,
    dispatch
  ]);

  // Debounced search for published forms
  const debouncedFormsSearch = useCallback(
    debounce((searchValue) => {
      dispatch(setPublishedFormsPage(1));
      dispatch(fetchPublishedForms({
        page: 1,
        size: publishedForms.pagination.pageSize,
        search: searchValue
      }));
    }, 500),
    [dispatch, publishedForms.pagination.pageSize]
  );

  // Debounced search for submissions
  const debouncedSubmissionsSearch = useCallback(
    debounce((searchValue) => {
      dispatch(setSubmissionsPage(1));
      dispatch(fetchMySubmissions({
        page: 1,
        size: mySubmissions.pagination.pageSize,
        search: searchValue
      }));
    }, 500),
    [dispatch, mySubmissions.pagination.pageSize]
  );

  const handleFormsSearchChange = (e) => {
    const value = e.target.value;
    dispatch(setPublishedFormsSearchTerm(value));
    debouncedFormsSearch(value);
  };

  const handleSubmissionsSearchChange = (e) => {
    const value = e.target.value;
    dispatch(setSubmissionsSearchTerm(value));
    debouncedSubmissionsSearch(value);
  };

  const handleSubmitResponse = async (formId) => {
    const result = await dispatch(checkExistingSubmission(formId));
    
    if (checkExistingSubmission.fulfilled.match(result) && result.payload) {
      setSelectedFormId(formId);
      setLastSubmissionDate(result.payload.submittedAt || result.payload.submitted_at);
      setShowSubmittedModal(true);
    } else {
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
    dispatch(setCurrentSubmission(submission));
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

  const handleFormsPageChange = (newPage) => {
    dispatch(setPublishedFormsPage(newPage));
  };

  const handleSubmissionsPageChange = (newPage) => {
    dispatch(setSubmissionsPage(newPage));
  };

  if (publishedForms.loading || mySubmissions.loading) return <LoadingSpinner />;

  return (
    <div className="published-form-page">
      <NavigationBar />

      <div className="learner-tabs-container">
        <div className="learner-tabs-wrapper">
          <div className="learner-tabs">
            <button
              className={`learner-tab ${activeTab === 'published' ? 'active' : ''}`}
              onClick={() => dispatch(setActiveTab('published'))}
            >
              Self-Service Forms
              {activeTab === 'published' && <div className="tab-indicator"></div>}
            </button>
            <button
              className={`learner-tab ${activeTab === 'submissions' ? 'active' : ''}`}
              onClick={() => dispatch(setActiveTab('submissions'))}
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
          publishedForms.error ? (
            <div className="error-state">
              <h3>Error</h3>
              <p>{publishedForms.error}</p>
              <button 
                onClick={() => dispatch(fetchPublishedForms({
                  page: publishedForms.pagination.page,
                  size: publishedForms.pagination.pageSize,
                  search: publishedForms.searchTerm
                }))} 
                className="retry-btn"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="published-form-list-header">
                <div className="text-container">
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
                    value={publishedForms.searchTerm}
                    onChange={handleFormsSearchChange}
                    className="form-search-input"
                  />
                </div>
              </div>

              {publishedForms.data.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <h3>No forms available</h3>
                  <p>{publishedForms.searchTerm ? 'No forms match your search' : 'No published forms available at the moment'}</p>
                </div>
              ) : (
                <>
                  <div className="form-grid">
                    {publishedForms.data.map((form) => (
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
                              disabled={existingSubmissionCheck.checking}
                            >
                              Submit Response
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination for Published Forms */}
                  {publishedForms.pagination.totalPages > 1 && (
                    <div className="pagination">
                      <button
                        onClick={() => handleFormsPageChange(publishedForms.pagination.page - 1)}
                        disabled={publishedForms.pagination.page === 1}
                      >
                        Previous
                      </button>
                      <span>{publishedForms.pagination.page} of {publishedForms.pagination.totalPages}</span>
                      <button
                        onClick={() => handleFormsPageChange(publishedForms.pagination.page + 1)}
                        disabled={publishedForms.pagination.page === publishedForms.pagination.totalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )
        ) : (
          // My Submissions Tab
          <div className="submission-table-container">
            <div className="submission-table-header">
              <select
                className="submission-dropdown"
                value={mySubmissions.filter}
                onChange={(e) => dispatch(setSubmissionsFilter(e.target.value))}
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
                    value={mySubmissions.searchTerm}
                    onChange={handleSubmissionsSearchChange}
                  />
                </div>
                <button className="submission-filter-btn">
                  <FiFilter /> Filter
                </button>
              </div>
            </div>

            {mySubmissions.data.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <h3>No submissions yet</h3>
                <p>
                  {mySubmissions.searchTerm 
                    ? `No submissions match your search "${mySubmissions.searchTerm}"`
                    : "You haven't submitted any forms yet. Start by submitting a form from the Published Forms tab."}
                </p>
                {!mySubmissions.searchTerm && (
                  <button
                    className="submit-now-btn"
                    onClick={() => dispatch(setActiveTab('published'))}
                  >
                    View Published Forms
                  </button>
                )}
              </div>
            ) : (
              <>
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
                      {mySubmissions.data.map((submission) => (
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
                {mySubmissions.pagination.totalPages > 1 && (
                  <div className="submission-pagination">
                    <div className="pagination-left">
                      <label>Items per page</label>
                      <select
                        value={mySubmissions.pagination.pageSize}
                        onChange={(e) => dispatch(setSubmissionsPageSize(Number(e.target.value)))}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                      <span>
                        {((mySubmissions.pagination.page - 1) * mySubmissions.pagination.pageSize) + 1}–
                        {Math.min(mySubmissions.pagination.page * mySubmissions.pagination.pageSize, mySubmissions.pagination.totalCount)} of {mySubmissions.pagination.totalCount} items
                      </span>
                    </div>
                    <div className="pagination-right">
                      <span>{mySubmissions.pagination.page} of {mySubmissions.pagination.totalPages} pages</span>
                      <button
                        className="pagination-page-btn"
                        onClick={() => handleSubmissionsPageChange(Math.max(1, mySubmissions.pagination.page - 1))}
                        disabled={mySubmissions.pagination.page === 1}
                      >
                        ←
                      </button>
                      <button
                        className="pagination-page-btn"
                        onClick={() => handleSubmissionsPageChange(Math.min(mySubmissions.pagination.totalPages, mySubmissions.pagination.page + 1))}
                        disabled={mySubmissions.pagination.page === mySubmissions.pagination.totalPages}
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
