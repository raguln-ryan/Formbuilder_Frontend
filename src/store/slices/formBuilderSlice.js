import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Form configuration (from FormEditor state)
  formData: {
    title: '',
    description: '',
    isVisible: false,
  },
  
  // Questions array (from FormEditor state)
  questions: [],
  
  // Current form ID (from FormEditor state)
  currentFormId: null,
  
  // UI states (from FormEditor state)
  activeTab: 'config',
  
  // Loading states (from FormEditor state)
  loading: false,
  saving: false,
  
  // Validation errors (from FormEditor state)
  errors: {},
  
  // Preview state (from FormLayout state)
  showPreview: false,
  showPublishModal: false,
  
  // Drag states (from FormBuilderCanvas state)
  draggedOver: false,
  draggedQuestionIndex: null,
  dragOverIndex: null,
  
  // Character limits (from FormEditor)
  TITLE_CHAR_LIMIT: 80,
  DESCRIPTION_CHAR_LIMIT: 200,
};

const formBuilderSlice = createSlice({
  name: 'formBuilder',
  initialState,
  reducers: {
    // ============ FORM CONFIG ACTIONS (Original FormEditor logic) ============
    setFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    
    setFormField: (state, action) => {
      const { field, value } = action.payload;
      
      // Original character limit logic from handleInputChange
      if (field === 'title' && value.length > state.TITLE_CHAR_LIMIT) {
        return;
      }
      if (field === 'description' && value.length > state.DESCRIPTION_CHAR_LIMIT) {
        return;
      }
      
      state.formData[field] = value;
      
      // Clear error for this field (original logic)
      if (state.errors[field]) {
        delete state.errors[field];
      }
    },
    
    // ============ QUESTIONS ACTIONS (Original FormEditor/FormBuilderCanvas logic) ============
    setQuestions: (state, action) => {
      state.questions = action.payload;
    },
    
    addQuestion: (state, action) => {
      // Original logic from FormBuilderCanvas handleDrop
      const newQuestion = {
        ...action.payload,
        order: state.questions.length,
      };
      state.questions.push(newQuestion);
    },
    
    updateQuestion: (state, action) => {
      // Original logic from FormBuilderCanvas handleQuestionUpdate
      const { index, question } = action.payload;
      state.questions[index] = question;
    },
    
    deleteQuestion: (state, action) => {
      // Original logic from FormBuilderCanvas handleQuestionDelete
      const index = action.payload;
      state.questions = state.questions.filter((_, i) => i !== index);
      
      // Update order for remaining questions
      state.questions.forEach((q, i) => {
        q.order = i;
      });
    },
    
    duplicateQuestion: (state, action) => {
      // Original logic from QuestionEditor handleDuplicate
      const questionToDuplicate = {
        ...action.payload,
        _id: `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question: `${action.payload.question} (Copy)`,
        order: state.questions.length,
        options: action.payload.options?.map(opt => ({
          ...opt,
          _id: `opt_${Date.now()}_${Math.random()}`
        }))
      };
      state.questions.push(questionToDuplicate);
    },
    
    moveQuestion: (state, action) => {
      // Original logic from FormBuilderCanvas handleQuestionMove
      const { index, direction } = action.payload;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (newIndex >= 0 && newIndex < state.questions.length) {
        [state.questions[index], state.questions[newIndex]] = 
        [state.questions[newIndex], state.questions[index]];
        
        state.questions.forEach((q, i) => {
          q.order = i;
        });
      }
    },
    
    reorderQuestions: (state, action) => {
      // Original drag and drop reorder logic from FormBuilderCanvas
      const { draggedIndex, dropIndex } = action.payload;
      
      if (draggedIndex === null || draggedIndex === dropIndex) {
        return;
      }
      
      const newQuestions = [...state.questions];
      const draggedQuestion = newQuestions[draggedIndex];
      
      newQuestions.splice(draggedIndex, 1);
      newQuestions.splice(dropIndex, 0, draggedQuestion);
      
      newQuestions.forEach((q, index) => {
        q.order = index;
      });
      
      state.questions = newQuestions;
    },
    
    // ============ UI STATE ACTIONS ============
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    
    setCurrentFormId: (state, action) => {
      state.currentFormId = action.payload;
    },
    
    togglePreview: (state) => {
      // Original logic from FormLayout togglePreview
      state.showPreview = !state.showPreview;
    },
    
    setShowPublishModal: (state, action) => {
      state.showPublishModal = action.payload;
    },
    
    // ============ LOADING STATES ============
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    setSaving: (state, action) => {
      state.saving = action.payload;
    },
    
    // ============ VALIDATION (Original FormEditor validateFormConfig logic) ============
    validateFormConfig: (state) => {
      const newErrors = {};
      
      // Original validation logic
      if (!state.formData.title.trim()) {
        newErrors.title = 'Form name is required';
      } else if (state.formData.title.trim().length < 3) {
        newErrors.title = 'Form name must be at least 3 characters';
      } else if (state.formData.title.length > state.TITLE_CHAR_LIMIT) {
        newErrors.title = `Form name cannot exceed ${state.TITLE_CHAR_LIMIT} characters`;
      }
      
      if (!state.formData.description.trim()) {
        newErrors.description = 'Form description is required';
      } else if (state.formData.description.trim().length < 10) {
        newErrors.description = 'Form description must be at least 10 characters';
      } else if (state.formData.description.length > state.DESCRIPTION_CHAR_LIMIT) {
        newErrors.description = `Form description cannot exceed ${state.DESCRIPTION_CHAR_LIMIT} characters`;
      }
      
      state.errors = newErrors;
    },
    
    setErrors: (state, action) => {
      state.errors = action.payload;
    },
    
    // ============ DRAG AND DROP STATES (Original FormBuilderCanvas logic) ============
    setDraggedOver: (state, action) => {
      state.draggedOver = action.payload;
    },
    
    setDraggedQuestionIndex: (state, action) => {
      state.draggedQuestionIndex = action.payload;
    },
    
    setDragOverIndex: (state, action) => {
      state.dragOverIndex = action.payload;
    },
    
    // ============ FORM LOADING (Original FormEditor fetchFormData logic) ============
    loadForm: (state, action) => {
      const { formData, questions, formId } = action.payload;
      state.formData = formData;
      state.questions = questions;
      state.currentFormId = formId;
    },
    
    // ============ RESET ============
    resetForm: () => initialState,
  },
});

export const {
  setFormData,
  setFormField,
  setQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  moveQuestion,
  reorderQuestions,
  setActiveTab,
  setCurrentFormId,
  togglePreview,
  setShowPublishModal,
  setLoading,
  setSaving,
  validateFormConfig,
  setErrors,
  setDraggedOver,
  setDraggedQuestionIndex,
  setDragOverIndex,
  loadForm,
  resetForm,
} = formBuilderSlice.actions;

export default formBuilderSlice.reducer;