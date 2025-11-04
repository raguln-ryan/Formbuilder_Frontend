import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import formService from '../../services/formService';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';
import Modal from '../Common/Modal';
import '../../styles/components/FormBuilder/FormList.css';
import searchIcon from '../../assets/Ellipse.png';
import toast from 'react-hot-toast';
import { debounce } from 'lodash'; // Install lodash if not already: npm install lodash

const FormList = () => {
  const [forms, setForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, formId: null });
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State to track enabled/disabled status for each form
  const [formEnabledStatus, setFormEnabledStatus] = useState({});
  
  // Updated pagination states - using page instead of currentPage for consistency
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Admin') {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch forms when page, pageSize, or searchTerm changes
  useEffect(() => {
    fetchForms();
  }, [page, pageSize]);

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue) => {
      setPage(1); // Reset to first page on search
      fetchForms(1, pageSize, searchValue);
    }, 500),
    [pageSize]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const fetchForms = async (pageNum = page, size = pageSize, search = searchTerm) => {
    try {
      setLoading(true);
      setError(null);
      

      // Call the service with the correct parameters
      const response = await formService.getAllForms(pageNum, size, search);

      
      console.log('Raw API Response:', response); // Debug log
      
      if (response) {




        let formsData = [];
        let total = 0;
        

        // Handle the response structure from your C# backend
        // Backend returns: { data: [...], totalCount: 14, pageNumber: 1, pageSize: 10, totalPages: 2 }
        if (response.data && Array.isArray(response.data)) {
          // This is the correct structure from your backend
          formsData = response.data;
          total = response.totalCount || formsData.length;
          
          // Set total pages from response or calculate it
          if (response.totalPages !== undefined) {
            setTotalPages(response.totalPages);
          } else {
            setTotalPages(Math.ceil(total / size));
          }
          
          console.log(`Loaded ${formsData.length} forms out of ${total} total`);
        } else if (Array.isArray(response)) {
          // Fallback if response is array directly (shouldn't happen with PaginatedResponse)
          formsData = response;
          total = response.length;
          setTotalPages(Math.ceil(total / size));
        } else {
          console.error('Unexpected response structure:', response);
          formsData = [];
          total = 0;
          setTotalPages(0);
        }
        
        setForms(formsData);
        setTotalItems(total);

        
        // Initialize enabled status for each form
        const initialStatus = {};


        formsData.forEach(form => {
          // Use the correct field name based on your backend response
          const formId = form.formId;  // Your backend returns 'formId' field
          if (formId) {
            initialStatus[formId] = form.isEnabled || false;
          }
        });
        setFormEnabledStatus(initialStatus);
        
      } else {
        console.log('No response received');
        setForms([]);
        setTotalItems(0);
        setTotalPages(0);
        setFormEnabledStatus({});
      }
    } catch (err) {

      console.error('Error in fetchForms:', err);
      toast.error('Error loading forms: ' + (err.response?.data?.message || err.message || 'Unknown error'));
      setError('Failed to load forms. Please try again.');
      setForms([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageSizeChange = (e) => {
    const newPageSize = parseInt(e.target.value);
    setPageSize(newPageSize);
    setPage(1);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(1);
    fetchForms(1, pageSize, '');
  };

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

  const handleDeleteClick = async (formId) => {
    const form = forms.find(f => f.formId === formId);
    
    let hasResponses = false;
    let responseCount = 0;
    
    if (form?.status === 1) {
      try {
        // Updated to use the new API signature with pagination
        const responses = await formService.getFormResponses(formId, 1, 100);
        const responseData = responses.data || responses;
        hasResponses = responseData.length > 0;
        responseCount = responses.totalCount || responseData.length || 0;
      } catch (error) {
        console.error('Error checking responses:', error);
      }
    }
    
    setDeleteModal({ 
      isOpen: true, 
      formId, 
      formTitle: form?.title || 'this form',
      hasResponses,
      responseCount,
      formStatus: form?.status
    });
    setActiveMenu(null);
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    
    const { formId, formTitle } = deleteModal;
    
    try {
      setIsDeleting(true);
      setDeleteModal({ isOpen: false, formId: null });
      
      const loadingToast = toast.loading(`Deleting form "${formTitle}"...`);
      
      const result = await formService.deleteForm(formId);
      console.log('Delete result:', result);
      
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success(result.message || `Form deleted successfully`);
        
        const remainingItems = totalItems - 1;
        const newTotalPages = Math.ceil(remainingItems / pageSize);
        
        if (page > newTotalPages && newTotalPages > 0) {
          setPage(newTotalPages);
        } else {
          setTimeout(() => {
            fetchForms();
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
      const errorMessage = error.message || 'Failed to delete form';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleMenu = (formId, e) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === formId ? null : formId);
  };

  const handleEdit = (formId) => {
    navigate(`/form/${formId}/edit`);
    setActiveMenu(null);
  };

  const handleViewResponses = (formId) => {
    navigate(`/form/${formId}/view`, { state: { activeTab: 'responses' } });
    setActiveMenu(null);
  };

  const handleViewForm = (formId) => {
    navigate(`/form/${formId}/view`, { state: { activeTab: 'questions' } });
    setActiveMenu(null);
  };

  const handleToggleEnable = (formId) => {
    const updateFormEnabled = (formsList) => 
      formsList.map(form => 
        form.formId === formId 
          ? { ...form, isEnabled: !form.isEnabled } 
          : form
      );
    
    setForms(updateFormEnabled);
    
    const currentForm = forms.find(f => f.formId === formId);
    const newStatus = !currentForm?.isEnabled;
    
    toast.success(`Form ${newStatus ? 'enabled' : 'disabled'}`, {
      duration: 2000,
      icon: newStatus ? '✅' : '⏸️',
    });
  };

  const handlePublish = async (formId) => {
    // Add your publish logic here
    setActiveMenu(null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.menu-container')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (loading && !searchTerm) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="form-list-container">
        <div className="error-state">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => fetchForms()} className="create-form-btn">
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
          {/* Updated search bar with server-side search */}
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
                  <button
                    className="menu-dots"
                    onClick={(e) => toggleMenu(form.formId, e)}
                    aria-label="More options"
                  >
                    <span></span>
                    <span></span>
                    <span></span>
                  </button>
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

                  <h3 className="form-name">{form.title || 'Untitled Form'}</h3>

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
                              ? new Date(form.publishedAt).toLocaleDateString()
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

         
        </>
      )}

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, formId: null })}
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
        confirmText={"Yes, Delete"}
      />

    </div>
  );
};

export default FormList;