import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import FormConfig from './FormConfig';
import FormLayout from './FormLayout';
import formService from '../../services/formService';
import LoadingSpinner from '../Common/LoadingSpinner';
import '../../styles/components/FormBuilder/FormEditor.css';

const FormEditor = ({ formId }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Admin') {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

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
      alert('Failed to load form data');
      navigate('/admin');
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

      // Save to localStorage as draft
      const savedForms = JSON.parse(localStorage.getItem('saved_forms') || '[]');
      const formToSave = {
        formId: savedFormId,
        _id: savedFormId,
        title: formData.title,
        description: formData.description,
        questions: questions,
        status: 0,
        savedAt: new Date().toISOString()
      };

      const existingIndex = savedForms.findIndex(f => f.formId === savedFormId);
      if (existingIndex >= 0) {
        savedForms[existingIndex] = formToSave;
      } else {
        savedForms.push(formToSave);
      }

      localStorage.setItem('saved_forms', JSON.stringify(savedForms));

      // Save questions if any exist
      if (questions.length > 0 && savedFormId) {
        await formService.updateForm(savedFormId, { questions });
      }

      alert('Form saved as draft successfully!');
    } catch (error) {
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

      // Save to localStorage
      const savedForms = JSON.parse(localStorage.getItem('saved_forms') || '[]');
      const formToSave = {
        formId: currentFormId,
        _id: currentFormId,
        title: formData.title,
        description: formData.description,
        questions: questions,
        status: 0,
        savedAt: new Date().toISOString()
      };

      const existingIndex = savedForms.findIndex(f => f.formId === currentFormId);
      if (existingIndex >= 0) {
        savedForms[existingIndex] = formToSave;
      } else {
        savedForms.push(formToSave);
      }

      localStorage.setItem('saved_forms', JSON.stringify(savedForms));

      await formService.updateForm(currentFormId, { questions });
      alert('Form saved as draft successfully!');
    } catch (error) {
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

    if (!questions || questions.length === 0) {
      alert('Cannot publish form without questions. Please add at least one question.');
      return;
    }

    try {
      setSaving(true);

      // Update form with questions
      await formService.updateForm(currentFormId, { questions });

      // Publish the form
      await formService.publishForm(currentFormId);

      alert('✅ Form published successfully!');

      navigate('/admin');
    } catch (error) {
      alert('Failed to publish form. ' + (error.response?.data?.message || ''));
    } finally {
      setSaving(false);
    }
  };


  const handleQuestionsChange = (updatedQuestions) => {
    setQuestions(updatedQuestions);
  };

  if (loading) {
    return <LoadingSpinner message="Loading form..." />;
  }

  return (
    <div className="form-editor-main-container">
      <div className="form-editor-content-wrapper">
        {/* Tabs header */}
        <div className="form-editor-tabs-header">
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'config' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('config')}
            >
              Form Configuration
            </button>
            <button
              className={`tab-button ${activeTab === 'layout' ? 'tab-active' : ''} ${!currentFormId && !formData.title ? 'tab-disabled' : ''}`}
              onClick={() => currentFormId || formData.title ? setActiveTab('layout') : null}
              disabled={!currentFormId && !formData.title}
            >
              Form Layout
            </button>
          </div>
        </div>

        {/* Content area */}
        {/* <div className="form-editor-content-area"> */}
        {activeTab === 'config' ? (
          <FormConfig
            formData={formData}
            onInputChange={handleInputChange}
            onSaveAsDraft={handleSaveAsDraft}
            onNext={handleNext}
            errors={errors}
            saving={saving}
            TITLE_CHAR_LIMIT={TITLE_CHAR_LIMIT}
            DESCRIPTION_CHAR_LIMIT={DESCRIPTION_CHAR_LIMIT}
          />
        ) : (
          <FormLayout
            formData={formData}
            questions={questions}
            onQuestionsChange={handleQuestionsChange}
            onSaveAsDraft={handleSaveLayoutAsDraft}
            onPublish={handlePublish}
            saving={saving}
          />
        )}
      </div>
    </div>
    // </div>
  );
};

export default FormEditor;
