import { createAsyncThunk } from '@reduxjs/toolkit';
import formService from '../../services/formService';
import {
  setLoading,
  setSaving,
  setCurrentFormId,
  loadForm,
  validateFormConfig,
} from '../slices/formBuilderSlice';
import toast from 'react-hot-toast';

// ============ ORIGINAL fetchFormData LOGIC ============
export const fetchFormData = createAsyncThunk(
  'formBuilder/fetchForm',
  async (formId, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await formService.getFormById(formId);
      
      if (response) {
        dispatch(loadForm({
          title: response.title || '',
          description: response.description || '',
          questions: response.questions || [],
          formId: formId
        }));
      }
      return response;
    } catch (error) {
      alert('Failed to load form data');
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Create new form
export const createForm = createAsyncThunk(
  'formBuilder/createForm',
  async (formData, { dispatch }) => {
    try {
      dispatch(setSaving(true));
      const response = await formService.createForm(formData);
      dispatch(setCurrentFormId(response.formId));
      return response;
    } catch (error) {
      toast.error('Failed to create form');
      throw error;
    } finally {
      dispatch(setSaving(false));
    }
  }
);

// Update form
export const updateForm = createAsyncThunk(
  'formBuilder/updateForm',
  async ({ formId, data }, { dispatch }) => {
    try {
      dispatch(setSaving(true));
      const response = await formService.updateForm(formId, data);
      toast.success('Form updated successfully');
      return response;
    } catch (error) {
      toast.error('Failed to update form');
      throw error;
    } finally {
      dispatch(setSaving(false));
    }
  }
);

// ============ ORIGINAL handleSaveAsDraft LOGIC (from FormEditor) ============
export const saveAsDraft = createAsyncThunk(
  'formBuilder/saveAsDraft',
  async (_, { getState, dispatch }) => {
    const state = getState().formBuilder;
    const { formData, questions, currentFormId, activeTab } = state;
    
    // Validate if on config tab
    if (activeTab === 'config') {
      dispatch(validateFormConfig());
      const errors = getState().formBuilder.errors;
      if (Object.keys(errors).length > 0) return;
    }
    
    try {
      dispatch(setSaving(true));
      let savedFormId = currentFormId;
      
      // Original logic from handleSaveAsDraft
      if (!savedFormId) {
        const response = await formService.createForm(formData);
        savedFormId = response.formId;
        dispatch(setCurrentFormId(savedFormId));
      } else {
        await formService.updateFormConfig(savedFormId, formData);
      }
      
      // Original localStorage logic
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
      
      // Save questions if any exist (original logic)
      if (questions.length > 0 && savedFormId) {
        await formService.updateForm(savedFormId, { questions });
      }
      
      toast.success('Form saved as draft successfully!');
      return savedFormId;
    } catch (error) {
      toast.error('Failed to save form. Please try again.');
      throw error;
    } finally {
      dispatch(setSaving(false));
    }
  }
);

// ============ ORIGINAL handleSaveLayoutAsDraft LOGIC ============
export const saveLayoutAsDraft = createAsyncThunk(
  'formBuilder/saveLayoutAsDraft',
  async (_, { getState, dispatch }) => {
    const state = getState().formBuilder;
    const { formData, questions, currentFormId } = state;
    
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
      
      // Original localStorage logic
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
      
      // Original question mapping logic
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
      await formService.updateForm(currentFormId, { questions: questionsForBackend });
      toast.success('Form saved as draft successfully!');
    } catch (error) {
      toast.error('Failed to save form as draft.');
      throw error;
    } finally {
      dispatch(setSaving(false));
    }
  }
);

// ============ ORIGINAL handlePublish LOGIC ============
export const publishForm = createAsyncThunk(
  'formBuilder/publishForm',
  async (navigate, { getState, dispatch }) => {
    const state = getState().formBuilder;
    const { currentFormId, questions } = state;
    
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
      
      // Original question mapping logic
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
      
      await formService.updateForm(currentFormId, { questions: questionsForBackend });
      await formService.publishForm(currentFormId);
      
      navigate('/admin');
    } catch (error) {
      toast.error('Failed to publish form. ' + (error.response?.data?.message || ''));
      throw error;
    } finally {
      dispatch(setSaving(false));
    }
  }
);

// ============ ORIGINAL handleNext LOGIC ============
export const proceedToLayout = createAsyncThunk(
  'formBuilder/proceedToLayout',
  async (_, { getState, dispatch }) => {
    const state = getState().formBuilder;
    const { formData, currentFormId } = state;
    
    dispatch(validateFormConfig());
    const errors = getState().formBuilder.errors;
    if (Object.keys(errors).length > 0) return;
    
    try {
      dispatch(setSaving(true));
      
      if (!currentFormId) {
        const response = await formService.createForm(formData);
        dispatch(setCurrentFormId(response.formId));
      } else {
        await formService.updateFormConfig(currentFormId, formData);
      }
      
      dispatch(setActiveTab('layout'));
    } catch (error) {
      toast.error('Failed to save form configuration.');
      throw error;
    } finally {
      dispatch(setSaving(false));
    }
  }
);