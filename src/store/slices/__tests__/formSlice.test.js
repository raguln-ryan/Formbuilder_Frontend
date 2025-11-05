import reducer, {
  updateFormData,
  updateQuestions,
  clearFormData,
  fetchFormDetails,
  updateForm
} from '../formSlice';
import formService from '../../../services/formService';

jest.mock('../../../services/formService');

describe('formSlice', () => {
  const initialState = {
    currentForm: null,
    formData: {
      title: '',
      description: '',
      isVisible: true,
      status: 'draft'
    },
    questions: [],
    loading: false,
    saving: false,
    error: null,
    lastFetchedFormId: null
  };

  describe('reducers', () => {
    it('should update form data', () => {
      const payload = { title: 'New Title', status: 'published' };
      const state = reducer(initialState, updateFormData(payload));
      expect(state.formData).toEqual({ ...initialState.formData, ...payload });
    });

    it('should update questions', () => {
      const questions = [{ id: 1, text: 'Question 1' }];
      const state = reducer(initialState, updateQuestions(questions));
      expect(state.questions).toEqual(questions);
    });

    it('should clear form data', () => {
      const modifiedState = {
        ...initialState,
        currentForm: { id: 1 },
        formData: { title: 'Test' },
        questions: [{ id: 1 }],
        lastFetchedFormId: 'test'
      };
      const state = reducer(modifiedState, clearFormData());
      expect(state).toEqual(initialState);
    });
  });

  describe('fetchFormDetails thunk', () => {
    it('should handle fetchFormDetails.pending', () => {
      const action = { type: fetchFormDetails.pending.type };
      const state = reducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should handle fetchFormDetails.fulfilled with complete data', () => {
      const payload = {
        title: 'Test Form',
        description: 'Test Description',
        isVisible: false,
        status: 'published',
        questions: [
          {
            id: 'q1',
            type: 'text',
            text: 'Question Text',
            description: 'Question Desc',
            required: true,
            order: 0,
            enabled: true,
            descriptionEnabled: true,
            options: ['Option 1'],
            format: 'email',
            maxLength: 100,
            singleChoice: true,
            multipleChoice: false
          }
        ]
      };
      
      const action = { 
        type: fetchFormDetails.fulfilled.type,
        payload,
        meta: { arg: 'form123' }
      };
      
      const state = reducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.currentForm).toEqual(payload);
      expect(state.formData.title).toBe('Test Form');
      expect(state.formData.description).toBe('Test Description');
      expect(state.formData.isVisible).toBe(false);
      expect(state.formData.status).toBe('published');
      expect(state.questions).toHaveLength(1);
      expect(state.questions[0]._id).toBe('q1');
      expect(state.questions[0].question).toBe('Question Text');
      expect(state.lastFetchedFormId).toBe('form123');
    });

    it('should handle fetchFormDetails.fulfilled with minimal data', () => {
      const payload = {};
      const action = { 
        type: fetchFormDetails.fulfilled.type,
        payload,
        meta: { arg: 'form123' }
      };
      
      const state = reducer(initialState, action);
      expect(state.formData.title).toBe('');
      expect(state.formData.isVisible).toBe(true);
      expect(state.questions).toEqual([]);
    });

    it('should handle fetchFormDetails.fulfilled with various question formats', () => {
      const payload = {
        questions: [
          { questionId: 'q1', question: 'Text1' },
          { _id: 'q2', questionText: 'Text2' },
          { text: 'Text3' }
        ]
      };
      
      const action = { 
        type: fetchFormDetails.fulfilled.type,
        payload,
        meta: { arg: 'form123' }
      };
      
      const state = reducer(initialState, action);
      expect(state.questions[0]._id).toBe('q1');
      expect(state.questions[0].question).toBe('Text1');
      expect(state.questions[1]._id).toBe('q2');
      expect(state.questions[1].question).toBe('Text2');
      expect(state.questions[2].question).toBe('Text3');
    });

    it('should handle fetchFormDetails.rejected', () => {
      const action = { 
        type: fetchFormDetails.rejected.type,
        error: { message: 'Error occurred' }
      };
      const state = reducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error occurred');
    });
  });

  describe('updateForm thunk', () => {
    it('should handle updateForm.pending', () => {
      const action = { type: updateForm.pending.type };
      const state = reducer(initialState, action);
      expect(state.saving).toBe(true);
    });

    it('should handle updateForm.fulfilled', () => {
      const action = { type: updateForm.fulfilled.type };
      const state = reducer(initialState, action);
      expect(state.saving).toBe(false);
    });

    it('should handle updateForm.rejected', () => {
      const action = { type: updateForm.rejected.type };
      const state = reducer(initialState, action);
      expect(state.saving).toBe(false);
    });
  });
});