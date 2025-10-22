import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionEditor from './SectionEditor';
import QuestionPreview from './QuestionPreview';
import formService from '../../services/formService';
import Button from '../Common/Button';
import Input from '../Common/Input';
import LoadingSpinner from '../Common/LoadingSpinner';
import '../../styles/components/FormBuilder/FormEditor.css';

const FormEditor = ({ formId }) => {
  const navigate = useNavigate();
  const isEdit = formId && formId !== 'new';
  
  const [activeTab, setActiveTab] = useState('config');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  
  const [questions, setQuestions] = useState([]);
  const [currentFormId, setCurrentFormId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Character limits
  const TITLE_CHAR_LIMIT = 80;
  const DESCRIPTION_CHAR_LIMIT = 200;

  useEffect(() => {
    if (isEdit) {
      fetchFormData();
    }
  }, [formId]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const response = await formService.getFormById(formId);
      if (response) {
        setFormData({
          title: response.title || '',
          description: response.description || ''
        });
        setQuestions(response.questions || []);
        setCurrentFormId(formId);
      }
    } catch (error) {
      console.error('Error fetching form:', error);
      alert('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const validateFormConfig = () => {
    const newErrors = {};
    
    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Form name is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Form name must be at least 3 characters';
    } else if (formData.title.length > TITLE_CHAR_LIMIT) {
      newErrors.title = `Form name cannot exceed ${TITLE_CHAR_LIMIT} characters`;
    }
    
    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Form description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Form description must be at least 10 characters';
    } else if (formData.description.length > DESCRIPTION_CHAR_LIMIT) {
      newErrors.description = `Form description cannot exceed ${DESCRIPTION_CHAR_LIMIT} characters`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    // Apply character limits
    if (field === 'title' && value.length > TITLE_CHAR_LIMIT) {
      return;
    }
    if (field === 'description' && value.length > DESCRIPTION_CHAR_LIMIT) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSaveAsDraft = async () => {
    if (!validateFormConfig()) return;
    
    try {
      setSaving(true);
      let savedFormId = currentFormId;
      
      if (!savedFormId) {
        // Create new form
        const response = await formService.createForm(formData);
        savedFormId = response.formId;
        setCurrentFormId(savedFormId);
      } else {
        // Update existing form config
        await formService.updateFormConfig(savedFormId, formData);
      }
      
      // Save questions if any exist
      if (questions.length > 0 && savedFormId) {
        await formService.updateForm(savedFormId, { questions });
      }
      
      alert('Form saved as draft successfully!');
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Failed to save form. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (!validateFormConfig()) return;
    
    try {
      setSaving(true);
      
      if (!currentFormId) {
        // Create form first
        const response = await formService.createForm(formData);
        setCurrentFormId(response.formId);
      } else {
        // Update form config
        await formService.updateFormConfig(currentFormId, formData);
      }
      
      setActiveTab('layout');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save form configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLayoutAsDraft = async () => {
    if (!currentFormId) {
      alert('Please save form configuration first');
      return;
    }
    
    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }
    
    try {
      setSaving(true);
      await formService.updateForm(currentFormId, { questions });
      alert('Form saved as draft successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save form as draft.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentFormId) {
      alert('Please save form first');
      return;
    }
    
    if (questions.length === 0) {
      alert('Cannot publish form without questions');
      return;
    }
    
    try {
      setSaving(true);
      // Save layout first
      await formService.updateForm(currentFormId, { questions });
      // Then publish
      await formService.publishForm(currentFormId);
      alert('Form published successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Error publishing form:', error);
      alert('Failed to publish form.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuestionsChange = (updatedQuestions) => {
    setQuestions(updatedQuestions);
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  if (loading) {
    return <LoadingSpinner message="Loading form..." />;
  }

  // Render Form Config Tab
  const renderFormConfig = () => (
    <div className="form-config-section">
      <div className="form-config-box">
        <h2 className="config-title">Form Configuration</h2>
        
        <div className="form-field">
          <Input
            label={`Form Name (${formData.title.length}/${TITLE_CHAR_LIMIT})`}
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter Form Name"
            error={errors.title}
            required
            maxLength={TITLE_CHAR_LIMIT}
          />
        </div>

        <div className="form-field">
          <Input
            type="textarea"
            label={`Form Description (${formData.description.length}/${DESCRIPTION_CHAR_LIMIT})`}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Summarize the form's purpose of internal reference."
            rows={4}
            error={errors.description}
            required
            maxLength={DESCRIPTION_CHAR_LIMIT}
          />
        </div>

        <div className="form-config-actions">
          <Button 
            variant="secondary"
            onClick={handleSaveAsDraft}
            loading={saving}
            disabled={!formData.title.trim() || !formData.description.trim()}
          >
            Save as Draft
          </Button>
          <Button 
            variant="primary"
            onClick={handleNext}
            loading={saving}
            disabled={!formData.title.trim() || !formData.description.trim()}
          >
            Next: Add Questions →
          </Button>
        </div>
      </div>
    </div>
  );

  // Render Form Layout Tab
  const renderFormLayout = () => (
    <div className="form-layout-section">
      {showPreview ? (
        <div className="preview-modal">
          <div className="preview-modal-content">
            <div className="preview-modal-header">
              <h2>Form Preview</h2>
              <button className="close-preview" onClick={togglePreview}>×</button>
            </div>
            <QuestionPreview
              formTitle={formData.title}
              formDescription={formData.description}
              questions={questions}
            />
          </div>
        </div>
      ) : null}
      
      <div className="layout-content-wrapper">
        <SectionEditor 
          questions={questions}
          onQuestionsChange={handleQuestionsChange}
          formTitle={formData.title}
          formDescription={formData.description}
        />
        
        <div className="form-layout-actions">
          <div className="action-group-left">
            <Button 
              variant="secondary"
              onClick={togglePreview}
            >
              <span style={{ marginRight: '8px' }}>👁️</span>
              Preview Form
            </Button>
          </div>
          <div className="action-group-right">
            <Button 
              variant="secondary"
              onClick={handleSaveLayoutAsDraft}
              loading={saving}
              disabled={questions.length === 0}
            >
              Save as Draft
            </Button>
            <Button 
              variant="primary"
              onClick={handlePublish}
              loading={saving}
              disabled={questions.length === 0}
            >
              Publish Form
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="form-editor-container">
      <div className="form-editor-header">
        <div className="header-left">
          <div className="form-editor-tabs">
            <button
              className={`tab ${activeTab === 'config' ? 'active' : ''}`}
              onClick={() => setActiveTab('config')}
            >
              Form Configuration
            </button>
            <button
              className={`tab ${activeTab === 'layout' ? 'active' : ''} ${!currentFormId && !formData.title ? 'disabled' : ''}`}
              onClick={() => currentFormId || formData.title ? setActiveTab('layout') : null}
              disabled={!currentFormId && !formData.title}
            >
              Form Layout
            </button>
          </div>
        </div>
        <div className="header-right">
          <button className="back-nav-button" onClick={() => navigate('/admin')}>
            Back to Dashboard →
          </button>
        </div>
      </div>

      <div className="form-editor-content">
        {activeTab === 'config' ? renderFormConfig() : renderFormLayout()}
      </div>
    </div>
  );
};

export default FormEditor;
