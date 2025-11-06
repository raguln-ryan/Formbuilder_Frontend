import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../contexts/AuthContext';
import { debounce } from 'lodash';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';
import Modal from '../Common/Modal';
import '../../styles/components/FormBuilder/FormList.css';
import searchIcon from '../../assets/Ellipse.png';
import {
  fetchForms,
  deleteForm,
  checkFormResponses,
  toggleFormEnabled,
  setSearchTerm,
  setPage,
  setPageSize,
  setActiveMenu,
  openDeleteModal,
  closeDeleteModal,
  resetFormList
} from '../../store/slices/formListSlice';

const FormList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Redux selectors
  const {
    forms,
    searchTerm,
    loading,
    error,
    deleteModal,
    activeMenu,
    isDeleting,
    formEnabledStatus,
    pagination
  } = useSelector((state) => state.formList);

  const { page, pageSize, totalItems, totalPages } = pagination;

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Admin') {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  // Initial load and cleanup
  useEffect(() => {
    return () => {
      dispatch(resetFormList());
    };
  }, [dispatch]);

  // Fetch forms when page or pageSize changes
  useEffect(() => {
    dispatch(fetchForms({ page, pageSize, searchTerm }));
  }, [dispatch, page, pageSize]);

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue) => {
      dispatch(setPage(1));
      dispatch(fetchForms({ page: 1, pageSize, searchTerm: searchValue }));
    }, 300),
    [dispatch, pageSize]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    dispatch(setSearchTerm(value));
    debouncedSearch(value);
  };

  // Clear search
  const handleClearSearch = () => {
    dispatch(setSearchTerm(''));
    dispatch(setPage(1));
    dispatch(fetchForms({ page: 1, pageSize, searchTerm: '' }));
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      dispatch(setPage(newPage));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageSizeChange = (e) => {
    const newPageSize = parseInt(e.target.value);
    dispatch(setPageSize(newPageSize));
  };

  // Menu handlers
  const toggleMenu = (formId, e) => {
    e.stopPropagation();
    dispatch(setActiveMenu(activeMenu === formId ? null : formId));
  };

  // Form actions
  const handleEdit = (formId) => {
    navigate(`/form/${formId}/edit`);
    dispatch(setActiveMenu(null));
  };

  const handleViewResponses = (formId) => {
    navigate(`/form/${formId}/view`, { state: { activeTab: 'responses' } });
    dispatch(setActiveMenu(null));
  };

  const handleViewForm = (formId) => {
    navigate(`/form/${formId}/view`, { state: { activeTab: 'configuration' } });
    dispatch(setActiveMenu(null));
  };

  const handleToggleEnable = (formId) => {
    const currentForm = forms.find(f => f.formId === formId);
    dispatch(toggleFormEnabled({ 
      formId, 
      currentStatus: currentForm?.isEnabled 
    }));
  };

  const handlePublish = async (formId) => {
    // Add your publish logic here
    dispatch(setActiveMenu(null));
  };

  // Delete handlers
  const handleDeleteClick = async (formId) => {
    const form = forms.find(f => f.formId === formId);
    
    // Prepare modal data
    const modalData = {
      formId,
      formTitle: form?.title || 'this form',
      formStatus: form?.status
    };

    // Check for responses if published
    if (form?.status === 1) {
      const result = await dispatch(checkFormResponses({ formId }));
      if (checkFormResponses.fulfilled.match(result)) {
        modalData.hasResponses = result.payload.hasResponses;
        modalData.responseCount = result.payload.responseCount;
      }
    }
    
    dispatch(openDeleteModal(modalData));
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    
    const { formId, formTitle } = deleteModal;
    dispatch(closeDeleteModal());
    
    const result = await dispatch(deleteForm({ formId, formTitle }));
    
    if (deleteForm.fulfilled.match(result)) {
      // Check if we need to refresh after page adjustment
      const remainingItems = totalItems - 1;
      const newTotalPages = Math.ceil(remainingItems / pageSize);
      
      if (page > newTotalPages && newTotalPages > 0) {
        // Page will be adjusted in the reducer
        setTimeout(() => {
          dispatch(fetchForms({ page: newTotalPages, pageSize, searchTerm }));
        }, 500);
      } else {
        setTimeout(() => {
          dispatch(fetchForms({ page, pageSize, searchTerm }));
        }, 500);
      }
    }
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.menu-container')) {
        dispatch(setActiveMenu(null));
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dispatch]);

  // Get page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Loading state
  if (loading && !searchTerm) return <LoadingSpinner />;

  // Error state
  if (error) {
    return (
      <div className="form-list-container">
        <div className="error-state">
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => dispatch(fetchForms({ page, pageSize, searchTerm }))} 
            className="create-form-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-list-container">
      <div className="form-list-header">
        <h2>Form List</h2>
        <div className="form-list-actions">
          <div className="search-bar">
            <img src={searchIcon} alt="Search" className="search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearchChange}
              className="form-search-input"
            />
          </div>

          <button
            className="create-form-btn"
            onClick={() => navigate('/form/new')}
          >
            Create Form
          </button>
        </div>
      </div>

      {loading && searchTerm ? (
        <div className="search-loading">
          <LoadingSpinner />
          <p>Searching for "{searchTerm}"...</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>No forms found</h3>
          <p>{searchTerm ? `No forms match your search "${searchTerm}"` : 'Create your first form to get started'}</p>
          {searchTerm ? (
            <button
              className="clear-search-btn primary"
              onClick={handleClearSearch}
            >
              Clear Search
            </button>
          ) : (
            <button
              className="create-form-btn"
              onClick={() => navigate('/form/new')}
            >
              Create Form
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="form-grid">
            {forms.map((form) => (
              <div key={form.formId} className="form-card">
                <div className="menu-container">
                  {activeMenu === form.formId && (
                    <div className="dropdown-menu">
                      {form.status === 0 ? (
                        <>
                          <button onClick={() => handleEdit(form.formId)} className="dropdown-item">
                            Edit
                          </button>
                          <button onClick={() => handlePublish(form.formId)} className="dropdown-item">
                            Publish
                          </button>
                          <button onClick={() => handleDeleteClick(form.formId)} className="dropdown-item delete">
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleViewForm(form.formId)} className="dropdown-item">
                            View Form
                          </button>
                          <button onClick={() => handleDeleteClick(form.formId)} className="dropdown-item delete">
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-card-content">
                  <h3 className="form-name">
                    {form.title || 'Untitled Form'}
                    <button
                      className="menu-dots"
                      onClick={(e) => toggleMenu(form.formId, e)}
                      aria-label="More options"
                    >
                      <span></span>
                      <span></span>
                      <span></span>
                    </button>
                  </h3>

                  <div className="form-details">
                    {form.status === 0 ? (
                      <>
                        <div className="form-detail-item">
                          <span className="form-detail-label">Created by:</span>
                          <span>{form.createdBy || 'Admin'}</span>
                        </div>
                        <div className="form-detail-item">
                          <span className="form-detail-label">Created date:</span>
                          <span>
                            {form.createdAt
                              ? new Date(form.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-detail-item">
                          <span className="form-detail-label">Published by:</span>
                          <span>{form.publishedBy || 'Admin'}</span>
                        </div>
                        <div className="form-detail-item">
                          <span className="form-detail-label">Published date:</span>
                          <span>
                            {form.publishedAt
                              ? new Date(form.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="form-card-footer">
                    <button className={`status-badge status-${form.status === 0 ? 'draft' : 'published'}`}>
                      {form.status === 0 ? 'Draft' : 'Published'}
                    </button>

                    {form.status === 1 && (
                      <div className="toggle-container">
                        <span className="toggle-label">Enabled</span>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={form.isEnabled || false}
                            onChange={() => handleToggleEnable(form.formId)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    )}

                    <button
                      className={`view-responses-btn ${form.status === 0 ? 'disabled' : ''}`}
                      onClick={() => {
                        if (form.status === 1) {
                          handleViewResponses(form.formId);
                        }
                      }}
                      disabled={form.status === 0}
                      title={form.status === 0 ? 'Publish form to view responses' : 'View form responses'}
                    >
                      View Responses
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                <span>Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} forms</span>
                <select value={pageSize} onChange={handlePageSizeChange} className="page-size-select">
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>

              <div className="pagination-buttons">
                <button 
                  onClick={() => handlePageChange(page - 1)} 
                  disabled={page === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                
                {getPageNumbers().map((pageNum, index) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`pagination-btn ${page === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  )
                ))}
                
                <button 
                  onClick={() => handlePageChange(page + 1)} 
                  disabled={page === totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => dispatch(closeDeleteModal())}
        onConfirm={handleDelete}
        title={`Delete ${deleteModal.formTitle || 'Form'}`}
        message={
          deleteModal.hasResponses 
            ? `This form has ${deleteModal.responseCount} submission(s). Deleting this form will permanently delete all associated responses and data. This action cannot be undone.`
            : deleteModal.formStatus === 1
            ? "Are you sure you want to delete this published form? This action cannot be undone."
            : "Are you sure you want to delete this draft form? This action cannot be undone."
        }
        variant="danger"
        confirmText="Yes, Delete"
      />
    </div>
  );
};

export default FormList;