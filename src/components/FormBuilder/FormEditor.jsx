import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../contexts/AuthContext';
import FormConfig from './FormConfig';
import FormLayout from './FormLayout';
import LoadingSpinner from '../Common/LoadingSpinner';
import {
  setActiveTab,
  setFormField,
  setQuestions,
  resetForm,
  validateFormConfig,
  setCurrentFormId,
  setFormData,
  setSaving,
  setLoading
} from '../../store/slices/formBuilderSlice';
import formService from '../../services/formService';
import toast from 'react-hot-toast';
import '../../styles/components/FormBuilder/FormEditor.css';

const FormEditor = ({ formId }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  
  const {
    formData,
    questions,
    currentFormId,
    activeTab,
    loading,
    saving,
    errors,
    TITLE_CHAR_LIMIT,
    DESCRIPTION_CHAR_LIMIT
  } = useSelector(state => state.formBuilder);
  
  const isEdit = formId && formId !== 'new';
  
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Admin') {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);
  
  useEffect(() => {
    if (isEdit) {
      fetchFormData();
    }
    return () => {
      dispatch(resetForm());
    };
  }, [formId, isEdit]);

  // Fetch form data - DIRECT API CALL
  const fetchFormData = async () => {
    try {
      dispatch(setLoading(true));
      const response = await formService.getFormById(formId);
      if (response) {
        dispatch(setFormData({
          title: response.title || '',
          description: response.description || ''
        }));
        dispatch(setQuestions(response.questions || []));
        dispatch(setCurrentFormId(formId));
      }
    } catch (error) {
      alert('Failed to load form data');
      navigate('/admin');
    } finally {
      dispatch(setLoading(false));
    }
  };
  
  const handleInputChange = (field, value) => {
    dispatch(setFormField({ field, value }));
  };
  
  // SAVE AS DRAFT - DIRECT API CALL (Original Logic)
  const handleSaveAsDraft = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      dispatch(setSaving(true));
      let savedFormId = currentFormId;

      if (!savedFormId) {
        // Create new form - ACTUAL API CALL
        const response = await formService.createForm(formData);
        savedFormId = response.formId;
        dispatch(setCurrentFormId(savedFormId));
      } else {
        // Update existing form - ACTUAL API CALL
        await formService.updateFormConfig(savedFormId, formData);
      }

      // Save to localStorage
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

      toast.success('Form saved as draft successfully!');
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error('Failed to save form. Please try again.');
    } finally {
      dispatch(setSaving(false));
    }
  };
  
  // NEXT BUTTON - DIRECT API CALL
  const handleNext = async () => {
    dispatch(validateFormConfig());
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      dispatch(setSaving(true));

      if (!currentFormId) {
        // Create form first - ACTUAL API CALL
        const response = await formService.createForm(formData);
        dispatch(setCurrentFormId(response.formId));
      } else {
        // Update form config - ACTUAL API CALL
        await formService.updateFormConfig(currentFormId, formData);
      }

      dispatch(setActiveTab('layout'));
    } catch (error) {
      console.error('Next error:', error);
      toast.error('Failed to save form configuration.');
    } finally {
      dispatch(setSaving(false));
    }
  };
  
  // SAVE LAYOUT AS DRAFT - DIRECT API CALL
  const handleSaveLayoutAsDraft = async () => {
    if (!currentFormId) {
      toast.error('Please save form configuration first');
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    try {
      dispatch(setSaving(true));

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

      // Map questions for backend
      const questionsForBackend = questions.map(q => ({
        id: q._id || q.questionId || q.id,
        text: q.question || q.questionText || '',
        type: q.type,
        options: q.options?.map(opt => opt.value || opt) || [],
        required: q.required || false,
        description: q.description || '',
        maxLength: q.maxLength || null,
        enabled: q.enabled !== false,
        descriptionEnabled: q.description_enabled || q.descriptionEnabled || false,
        singleChoice: q.single_choice || false,
        multipleChoice: q.multiple_choice || false,
        format: q.format || null,
        order: q.order || 0
      }));

      console.log('Saving questions to backend:', questionsForBackend);
      
      // ACTUAL API CALL
      await formService.updateForm(currentFormId, { questions: questionsForBackend });
      toast.success('Form saved as draft successfully!');
    } catch (error) {
      console.error('Save layout draft error:', error);
      toast.error('Failed to save form as draft.');
    } finally {
      dispatch(setSaving(false));
    }
  };
  
  // PUBLISH - DIRECT API CALL
  const handlePublish = async () => {
    if (!currentFormId) {
      toast.error('Please save form first');
      return;
    }

    if (!questions || questions.length === 0) {
      toast.error('Cannot publish form without questions. Please add at least one question.');
      return;
    }

    try {
      dispatch(setSaving(true));

      // Map questions for backend
      const questionsForBackend = questions.map(q => ({
        id: q._id || q.questionId || q.id,
        text: q.question || q.questionText || '',
        type: q.type,
        options: q.options?.map(opt => opt.value || opt) || [],
        required: q.required || false,
        description: q.description || '',
        maxLength: q.maxLength || null,
        enabled: q.enabled !== false,
        descriptionEnabled: q.description_enabled || q.descriptionEnabled || false,
        singleChoice: q.single_choice || false,
        multipleChoice: q.multiple_choice || false,
        format: q.format || null,
        order: q.order || 0
      }));

      console.log('Publishing with questions:', questionsForBackend);

      // ACTUAL API CALLS
      await formService.updateForm(currentFormId, { questions: questionsForBackend });
      await formService.publishForm(currentFormId);

      navigate('/admin');
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish form. ' + (error.response?.data?.message || ''));
    } finally {
      dispatch(setSaving(false));
    }
  };
  
  const handleQuestionsChange = (updatedQuestions) => {
    console.log('FormEditor received questions update:', updatedQuestions);
    dispatch(setQuestions(updatedQuestions));
  };
  
  if (loading) {
    return <LoadingSpinner message="Loading form..." />;
  }
  
  return (
    <div className="form-editor-main-container">
      <div className="form-editor-content-wrapper">
        <div className="form-editor-tabs-header">
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'config' ? 'tab-active' : ''}`}
              onClick={() => dispatch(setActiveTab('config'))}
            >
              Form Configuration
            </button>
            <button
              className={`tab-button ${activeTab === 'layout' ? 'tab-active' : ''} ${!currentFormId && !formData.title ? 'tab-disabled' : ''}`}
              onClick={() => currentFormId || formData.title ? dispatch(setActiveTab('layout')) : null}
              disabled={!currentFormId && !formData.title}
            >
              Form Layout
            </button>
          </div>
        </div>
        
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
  );
};

export default FormEditor;
