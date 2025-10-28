import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import formService from '../../services/formService';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';
import Modal from '../Common/Modal';
import '../../styles/components/FormBuilder/FormList.css';
import searchIcon from '../../assets/Ellipse.png';
import toast from 'react-hot-toast'; 


const FormList = () => {
  const [forms, setForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, formId: null });
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Admin') {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    fetchForms();
  }, []);

  useEffect(() => {
    const filtered = forms.filter((form) =>
      form.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredForms(filtered);
  }, [searchTerm, forms]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.menu-container')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await formService.getAllForms();

      if (response?.data) {
        setForms(response.data);
        setFilteredForms(response.data);
      } else if (Array.isArray(response)) {
        setForms(response);
        setFilteredForms(response);
      } else {
        setForms([]);
        setFilteredForms([]);
      }
    } catch (err) {
      toast.error('Error loading forms: ' + (err.response?.data?.message || ''));
      setError('Failed to load forms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (formId) => {
    // Find the form to check its status and get details
    const form = forms.find(f => (f.formId || f._id) === formId);
    
    // Check if form has responses (for published forms)
    let hasResponses = false;
    let responseCount = 0;
    
    if (form?.status === 1) { // Published form
      try {
        // Check if there are responses for this form
        const responses = await formService.getFormResponses(formId);
        hasResponses = responses && responses.length > 0;
        responseCount = responses?.length || 0;
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
      
      // Now result will have { success: true, message: "..." }
      if (result.success) {
        toast.success(result.message || `Form deleted successfully`);
        // Refresh the forms list
        setTimeout(() => {
          fetchForms();
        }, 500);
      }
      
    } catch (error) {
      console.error('Error in handleDelete:', error);
      
      const errorMessage = error.message || 'Failed to delete form';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Update handlePublish function
  const handlePublish = async (formId) => {
    setPublishModal({ isOpen: true, formId });
    setActiveMenu(null);
  };

  const toggleMenu = (formId, e) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === formId ? null : formId);
  };

  const handleEdit = (formId) => {
    navigate(`/form/${formId}/edit`);
    setActiveMenu(null);
  };

  // Updated to navigate to form view page with responses tab active
  const handleViewResponses = (formId) => {
    // Navigate to form view page with state to activate responses tab
    navigate(`/form/${formId}/view`, { state: { activeTab: 'responses' } });
    setActiveMenu(null);
  };

  const handleViewForm = (formId) => {
    // Navigate to form view page with questions tab active (default)
    navigate(`/form/${formId}/view`, { state: { activeTab: 'questions' } });
    setActiveMenu(null);
  };

  const handleToggleEnable = async (formId) => {
    try {
      const form = forms.find(f => (f.formId || f._id) === formId);
      const newEnabledStatus = !form.isEnabled;

      // Update the form's enabled status
      await formService.updateFormStatus(formId, { isEnabled: newEnabledStatus });

      // Refresh the forms list
      fetchForms();
    } catch (error) {
      toast.error('Error toggling form status: ' + (error.response?.data?.message || ''));
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="form-list-container">
        <div className="error-state">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchForms} className="create-form-btn">
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
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

      {filteredForms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>No forms found</h3>
          <p>{searchTerm ? 'No forms match your search' : 'Create your first form to get started'}</p>
          {!searchTerm && (
            <button
              className="create-form-btn"
              onClick={() => navigate('/form/new')}
            >
              Create Form
            </button>
          )}
        </div>
      ) : (
        <div className="form-grid">
          {filteredForms.map((form) => (
            <div key={form.formId || form._id} className="form-card">
              <div className="menu-container">
                <button
                  className="menu-dots"
                  onClick={(e) => toggleMenu(form.formId || form._id, e)}
                  aria-label="More options"
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </button>
                {activeMenu === (form.formId || form._id) && (
                  <div className="dropdown-menu">
                    {form.status === 0 ? (
                      // Draft status - show Edit, Publish, Delete
                      <>
                        <button
                          onClick={() => handleEdit(form.formId || form._id)}
                          className="dropdown-item"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handlePublish(form.formId || form._id)}
                          className="dropdown-item"
                        >
                          Publish
                        </button>
                        <button
                          onClick={() => handleDeleteClick(form.formId || form._id)}
                          className="dropdown-item delete"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      // Published status - show View Form, Delete
                      <>
                        <button
                          onClick={() => handleViewForm(form.formId || form._id)}
                          className="dropdown-item"
                        >
                          View Form
                        </button>
                        <button
                          onClick={() => handleDeleteClick(form.formId || form._id)}
                          className="dropdown-item delete"
                        >
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
                          {form.createdDate
                            ? new Date(form.createdDate).toLocaleDateString()
                            : new Date().toLocaleDateString()}
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
                          {form.publishedDate
                            ? new Date(form.publishedDate).toLocaleDateString()
                            : new Date().toLocaleDateString()}
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
                          onChange={() => handleToggleEnable(form.formId || form._id)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  )}

                  {/* View Responses button - navigates to form view page with responses tab */}
                  <button
                    className={`view-responses-btn ${form.status === 0 ? 'disabled' : ''}`}
                    onClick={() => {
                      if (form.status === 1) {
                        handleViewResponses(form.formId || form._id);
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
