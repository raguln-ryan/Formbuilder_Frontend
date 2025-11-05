import reducer, {
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
} from '../formBuilderSlice';

describe('formBuilderSlice', () => {
  const initialState = {
    formData: {
      title: '',
      description: '',
      isVisible: false,
    },
    questions: [],
    currentFormId: null,
    activeTab: 'config',
    loading: false,
    saving: false,
    errors: {},
    showPreview: false,
    showPublishModal: false,
    draggedOver: false,
    draggedQuestionIndex: null,
    dragOverIndex: null,
    TITLE_CHAR_LIMIT: 80,
    DESCRIPTION_CHAR_LIMIT: 200,
  };

  describe('setFormData', () => {
    it('should update form data', () => {
      const newData = { title: 'Test Form', description: 'Test Description' };
      const state = reducer(initialState, setFormData(newData));
      expect(state.formData).toEqual({ ...initialState.formData, ...newData });
    });
  });

  describe('setFormField', () => {
    it('should update a single form field', () => {
      const state = reducer(initialState, setFormField({ field: 'title', value: 'New Title' }));
      expect(state.formData.title).toBe('New Title');
    });

    it('should not exceed title character limit', () => {
      const longTitle = 'a'.repeat(100);
      const state = reducer(initialState, setFormField({ field: 'title', value: longTitle }));
      expect(state.formData.title).toBe('');
    });

    it('should not exceed description character limit', () => {
      const longDesc = 'a'.repeat(250);
      const state = reducer(initialState, setFormField({ field: 'description', value: longDesc }));
      expect(state.formData.description).toBe('');
    });

    it('should clear error when field is updated', () => {
      const stateWithError = { ...initialState, errors: { title: 'Error' } };
      const state = reducer(stateWithError, setFormField({ field: 'title', value: 'Valid' }));
      expect(state.errors.title).toBeUndefined();
    });
  });

  describe('setQuestions', () => {
    it('should set questions array', () => {
      const questions = [{ id: 1, question: 'Test?' }];
      const state = reducer(initialState, setQuestions(questions));
      expect(state.questions).toEqual(questions);
    });
  });

  describe('addQuestion', () => {
    it('should add a question with order', () => {
      const question = { id: 1, question: 'New Question' };
      const state = reducer(initialState, addQuestion(question));
      expect(state.questions).toHaveLength(1);
      expect(state.questions[0].order).toBe(0);
    });

    it('should add question at correct order', () => {
      const stateWithQuestions = { ...initialState, questions: [{ id: 1 }] };
      const newQuestion = { id: 2, question: 'Second' };
      const state = reducer(stateWithQuestions, addQuestion(newQuestion));
      expect(state.questions[1].order).toBe(1);
    });
  });

  describe('updateQuestion', () => {
    it('should update question at index', () => {
      const stateWithQuestions = { 
        ...initialState, 
        questions: [{ id: 1, question: 'Old' }] 
      };
      const updatedQuestion = { id: 1, question: 'Updated' };
      const state = reducer(stateWithQuestions, updateQuestion({ index: 0, question: updatedQuestion }));
      expect(state.questions[0].question).toBe('Updated');
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question and update order', () => {
      const stateWithQuestions = { 
        ...initialState, 
        questions: [
          { id: 1, order: 0 },
          { id: 2, order: 1 },
          { id: 3, order: 2 }
        ] 
      };
      const state = reducer(stateWithQuestions, deleteQuestion(1));
      expect(state.questions).toHaveLength(2);
      expect(state.questions[0].order).toBe(0);
      expect(state.questions[1].order).toBe(1);
    });
  });

  describe('duplicateQuestion', () => {
    it('should duplicate question with new id', () => {
      const originalQuestion = {
        _id: 'original',
        question: 'Original',
        options: [{ _id: 'opt1', value: 'Option' }]
      };
      const state = reducer(initialState, duplicateQuestion(originalQuestion));
      expect(state.questions).toHaveLength(1);
      expect(state.questions[0].question).toBe('Original (Copy)');
      expect(state.questions[0]._id).not.toBe('original');
      expect(state.questions[0].order).toBe(0);
    });

    it('should handle question without options', () => {
      const question = { _id: 'test', question: 'Test' };
      const state = reducer(initialState, duplicateQuestion(question));
      expect(state.questions[0].options).toBeUndefined();
    });
  });

  describe('moveQuestion', () => {
    it('should move question up', () => {
      const stateWithQuestions = { 
        ...initialState, 
        questions: [
          { id: 1, question: 'First' },
          { id: 2, question: 'Second' }
        ] 
      };
      const state = reducer(stateWithQuestions, moveQuestion({ index: 1, direction: 'up' }));
      expect(state.questions[0].question).toBe('Second');
      expect(state.questions[1].question).toBe('First');
    });

    it('should move question down', () => {
      const stateWithQuestions = { 
        ...initialState, 
        questions: [
          { id: 1, question: 'First' },
          { id: 2, question: 'Second' }
        ] 
      };
      const state = reducer(stateWithQuestions, moveQuestion({ index: 0, direction: 'down' }));
      expect(state.questions[0].question).toBe('Second');
      expect(state.questions[1].question).toBe('First');
    });

    it('should not move beyond boundaries', () => {
      const stateWithQuestions = { 
        ...initialState, 
        questions: [{ id: 1 }] 
      };
      const state = reducer(stateWithQuestions, moveQuestion({ index: 0, direction: 'up' }));
      expect(state.questions).toEqual(stateWithQuestions.questions);
    });
  });

  describe('reorderQuestions', () => {
    it('should reorder questions', () => {
      const stateWithQuestions = { 
        ...initialState, 
        questions: [
          { id: 1, question: 'First' },
          { id: 2, question: 'Second' },
          { id: 3, question: 'Third' }
        ] 
      };
      const state = reducer(stateWithQuestions, reorderQuestions({ draggedIndex: 0, dropIndex: 2 }));
      expect(state.questions[0].question).toBe('Second');
      expect(state.questions[1].question).toBe('Third');
      expect(state.questions[2].question).toBe('First');
    });

    it('should not reorder if indices are same', () => {
      const stateWithQuestions = { 
        ...initialState, 
        questions: [{ id: 1 }, { id: 2 }] 
      };
      const state = reducer(stateWithQuestions, reorderQuestions({ draggedIndex: 0, dropIndex: 0 }));
      expect(state.questions).toEqual(stateWithQuestions.questions);
    });

    it('should not reorder if draggedIndex is null', () => {
      const stateWithQuestions = { 
        ...initialState, 
        questions: [{ id: 1 }, { id: 2 }] 
      };
      const state = reducer(stateWithQuestions, reorderQuestions({ draggedIndex: null, dropIndex: 1 }));
      expect(state.questions).toEqual(stateWithQuestions.questions);
    });
  });

  describe('UI state actions', () => {
    it('should set active tab', () => {
      const state = reducer(initialState, setActiveTab('layout'));
      expect(state.activeTab).toBe('layout');
    });

    it('should set current form id', () => {
      const state = reducer(initialState, setCurrentFormId('form123'));
      expect(state.currentFormId).toBe('form123');
    });

    it('should toggle preview', () => {
      const state = reducer(initialState, togglePreview());
      expect(state.showPreview).toBe(true);
      const state2 = reducer(state, togglePreview());
      expect(state2.showPreview).toBe(false);
    });

    it('should set show publish modal', () => {
      const state = reducer(initialState, setShowPublishModal(true));
      expect(state.showPublishModal).toBe(true);
    });
  });

  describe('Loading states', () => {
    it('should set loading', () => {
      const state = reducer(initialState, setLoading(true));
      expect(state.loading).toBe(true);
    });

    it('should set saving', () => {
      const state = reducer(initialState, setSaving(true));
      expect(state.saving).toBe(true);
    });
  });

  describe('validateFormConfig', () => {
    it('should validate empty title', () => {
      const state = reducer(initialState, validateFormConfig());
      expect(state.errors.title).toBe('Form name is required');
    });

    it('should validate short title', () => {
      const stateWithTitle = { 
        ...initialState, 
        formData: { ...initialState.formData, title: 'ab' } 
      };
      const state = reducer(stateWithTitle, validateFormConfig());
      expect(state.errors.title).toBe('Form name must be at least 3 characters');
    });

    it('should validate long title', () => {
      const stateWithTitle = { 
        ...initialState, 
        formData: { ...initialState.formData, title: 'a'.repeat(85) } 
      };
      const state = reducer(stateWithTitle, validateFormConfig());
      expect(state.errors.title).toContain('cannot exceed 80 characters');
    });

    it('should validate empty description', () => {
      const stateWithTitle = { 
        ...initialState, 
        formData: { ...initialState.formData, title: 'Valid Title' } 
      };
      const state = reducer(stateWithTitle, validateFormConfig());
      expect(state.errors.description).toBe('Form description is required');
    });

    it('should validate short description', () => {
      const stateWithData = { 
        ...initialState, 
        formData: { 
          title: 'Valid Title',
          description: 'Short' 
        } 
      };
      const state = reducer(stateWithData, validateFormConfig());
      expect(state.errors.description).toBe('Form description must be at least 10 characters');
    });

    it('should validate long description', () => {
      const stateWithData = { 
        ...initialState, 
        formData: { 
          title: 'Valid Title',
          description: 'a'.repeat(205) 
        } 
      };
      const state = reducer(stateWithData, validateFormConfig());
      expect(state.errors.description).toContain('cannot exceed 200 characters');
    });

    it('should pass validation with valid data', () => {
      const stateWithData = { 
        ...initialState, 
        formData: { 
          title: 'Valid Form Title',
          description: 'This is a valid description for the form' 
        } 
      };
      const state = reducer(stateWithData, validateFormConfig());
      expect(Object.keys(state.errors)).toHaveLength(0);
    });
  });

  describe('setErrors', () => {
    it('should set errors', () => {
      const errors = { title: 'Error 1', description: 'Error 2' };
      const state = reducer(initialState, setErrors(errors));
      expect(state.errors).toEqual(errors);
    });
  });

  describe('Drag and drop states', () => {
    it('should set draggedOver', () => {
      const state = reducer(initialState, setDraggedOver(true));
      expect(state.draggedOver).toBe(true);
    });

    it('should set draggedQuestionIndex', () => {
      const state = reducer(initialState, setDraggedQuestionIndex(2));
      expect(state.draggedQuestionIndex).toBe(2);
    });

    it('should set dragOverIndex', () => {
      const state = reducer(initialState, setDragOverIndex(3));
      expect(state.dragOverIndex).toBe(3);
    });
  });

  describe('loadForm', () => {
    it('should load form data', () => {
      const payload = {
        formData: { title: 'Loaded', description: 'Test' },
        questions: [{ id: 1 }],
        formId: 'form123'
      };
      const state = reducer(initialState, loadForm(payload));
      expect(state.formData).toEqual(payload.formData);
      expect(state.questions).toEqual(payload.questions);
      expect(state.currentFormId).toBe('form123');
    });
  });

  describe('resetForm', () => {
    it('should reset to initial state', () => {
      const modifiedState = {
        ...initialState,
        formData: { title: 'Test' },
        questions: [{ id: 1 }],
        currentFormId: 'test'
      };
      const state = reducer(modifiedState, resetForm());
      expect(state).toEqual(initialState);
    });
  });
});