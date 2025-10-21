import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import formService from '../../services/formService';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';
import Modal from '../Common/Modal';
import '../../styles/components/FormBuilder/FormList.css';

const FormList = () => {
  const [forms, setForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, formId: null });
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const navigate = useNavigate();

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
      console.error('Error loading forms:', err);
      setError('Failed to load forms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await formService.deleteForm(deleteModal.formId);
      setDeleteModal({ isOpen: false, formId: null });
      fetchForms();
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  };

  const handlePublish = async (formId) => {
    try {
      await formService.publishForm(formId);
      fetchForms();
    } catch (error) {
      console.error('Error publishing form:', error);
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

  const handleDeleteClick = (formId) => {
    setDeleteModal({ isOpen: true, formId });
    setActiveMenu(null);
  };

  const handleViewResponses = (formId) => {
    // Navigate to responses page with the form ID
    navigate(`/form/${formId}/responses`);
    setActiveMenu(null);
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
          <input
            type="text"
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-search-input"
          />
          <button 
            className="create-form-btn"
            onClick={() => navigate('/form/new')}
          >
            + Create Form
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
              + Create Form
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
                    <button 
                      onClick={() => handleEdit(form.formId || form._id)}
                      disabled={form.status === 1}
                      className="dropdown-item"
                    >
                      Edit
                    </button>
                    {form.status === 0 && (
                      <button 
                        onClick={() => handlePublish(form.formId || form._id)}
                        className="dropdown-item"
                      >
                        Publish
                      </button>
                    )}
                    <hr className="dropdown-divider" />
                    <button 
                      onClick={() => handleDeleteClick(form.formId || form._id)}
                      className="dropdown-item delete"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="form-card-content">
                <h3 className="form-name">{form.title || 'Untitled Form'}</h3>
                
                <div className="form-details">
                  {/* Show different details based on status */}
                  {form.status === 0 ? (
                    // Draft form details
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
                      <div className="form-detail-item">
                        <span className="form-detail-label">Workflow usage:</span>
                        <span>{form.workflowUsage || 'Standard'}</span>
                      </div>
                    </>
                  ) : (
                    // Published form details
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
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="form-detail-item">
                        <span className="form-detail-label">Workflow usage:</span>
                        <span>{form.workflowUsage || 'Standard'}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="form-card-footer">
                  <button className={`status-badge status-${form.status === 0 ? 'draft' : 'published'}`}>
                    {form.status === 0 ? 'Draft' : 'Published'}
                  </button>
                  <button 
                    className="view-responses-btn"
                    onClick={() => handleViewResponses(form.formId || form._id)}
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
        title="Delete Form"
        message="Are you sure you want to delete this form? This action cannot be undone."
        variant="danger"
      />
    </div>
  );
};

export default FormList;
