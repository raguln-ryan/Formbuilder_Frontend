import { configureStore } from '@reduxjs/toolkit';
import formBuilderReducer from '../../slices/formBuilderSlice';
import {
  fetchFormData,
  createForm,
  updateForm,
  saveAsDraft,
  saveLayoutAsDraft,
  publishForm,
  proceedToLayout
} from '../formBuilderThunks';
import formService from '../../../services/formService';
import toast from 'react-hot-toast';

jest.mock('../../../services/formService');
jest.mock('react-hot-toast');

describe('formBuilderThunks', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        formBuilder: formBuilderReducer
      }
    });
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('fetchFormData', () => {
    it('should fetch and load form data', async () => {
      const formData = {
        title: 'Test Form',
        description: 'Test Description',
        questions: [{ id: 1, text: 'Question' }]
      };
      formService.getFormById.mockResolvedValue(formData);

      await store.dispatch(fetchFormData('form123'));
      
      const state = store.getState().formBuilder;
      expect(state.formData.title).toBe('Test Form');
      expect(state.questions).toEqual(formData.questions);
      expect(state.currentFormId).toBe('form123');
    });

    it('should handle fetch error', async () => {
      formService.getFormById.mockRejectedValue(new Error('Network error'));
      global.alert = jest.fn();

      await expect(store.dispatch(fetchFormData('form123'))).rejects.toThrow();
      expect(global.alert).toHaveBeenCalledWith('Failed to load form data');
    });

    it('should handle empty response', async () => {
      formService.getFormById.mockResolvedValue(null);

      await store.dispatch(fetchFormData('form123'));
      
      const state = store.getState().formBuilder;
      expect(state.loading).toBe(false);
    });
  });

  describe('createForm', () => {
    it('should create form successfully', async () => {
      const response = { formId: 'new-form-123' };
      formService.createForm.mockResolvedValue(response);

      const result = await store.dispatch(createForm({ title: 'New Form' }));
      
      expect(formService.createForm).toHaveBeenCalledWith({ title: 'New Form' });
      expect(store.getState().formBuilder.currentFormId).toBe('new-form-123');
      expect(result.payload).toEqual(response);
    });

    it('should handle create error', async () => {
      formService.createForm.mockRejectedValue(new Error('Create failed'));

      await expect(store.dispatch(createForm({}))).rejects.toThrow();
      expect(toast.error).toHaveBeenCalledWith('Failed to create form');
    });
  });

  describe('updateForm', () => {
    it('should update form successfully', async () => {
      const response = { success: true };
      formService.updateForm.mockResolvedValue(response);

      const result = await store.dispatch(updateForm({ 
        formId: 'form123', 
        data: { title: 'Updated' } 
      }));
      
      expect(formService.updateForm).toHaveBeenCalledWith('form123', { title: 'Updated' });
      expect(toast.success).toHaveBeenCalledWith('Form updated successfully');
      expect(result.payload).toEqual(response);
    });

    it('should handle update error', async () => {
      formService.updateForm.mockRejectedValue(new Error('Update failed'));

      await expect(store.dispatch(updateForm({ formId: 'form123', data: {} }))).rejects.toThrow();
      expect(toast.error).toHaveBeenCalledWith('Failed to update form');
    });
  });

  describe('saveAsDraft', () => {
    it('should create new form when no currentFormId', async () => {
      const response = { formId: 'new-form' };
      formService.createForm.mockResolvedValue(response);
      formService.updateForm.mockResolvedValue({});

      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            formData: { title: 'Test', description: 'Description' },
            questions: [{ id: 1, text: 'Question' }],
            currentFormId: null,
            activeTab: 'layout',
            errors: {}
          }
        }
      });

      await store.dispatch(saveAsDraft());
      
      expect(formService.createForm).toHaveBeenCalled();
      expect(store.getState().formBuilder.currentFormId).toBe('new-form');
      expect(toast.success).toHaveBeenCalledWith('Form saved as draft successfully!');
    });

    it('should update existing form when currentFormId exists', async () => {
      formService.updateFormConfig.mockResolvedValue({});
      formService.updateForm.mockResolvedValue({});

      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            formData: { title: 'Test', description: 'Description' },
            questions: [{ id: 1, text: 'Question' }],
            currentFormId: 'existing-form',
            activeTab: 'layout',
            errors: {}
          }
        }
      });

      await store.dispatch(saveAsDraft());
      
      expect(formService.updateFormConfig).toHaveBeenCalledWith('existing-form', expect.any(Object));
      expect(formService.updateForm).toHaveBeenCalledWith('existing-form', { questions: expect.any(Array) });
    });

    it('should validate form config when on config tab', async () => {
      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            formData: { title: '', description: '' },
            questions: [],
            currentFormId: null,
            activeTab: 'config',
            errors: {},
            TITLE_CHAR_LIMIT: 80,
            DESCRIPTION_CHAR_LIMIT: 200
          }
        }
      });

      await store.dispatch(saveAsDraft());
      
      const state = store.getState().formBuilder;
      expect(state.errors.title).toBeDefined();
      expect(state.errors.description).toBeDefined();
      expect(formService.createForm).not.toHaveBeenCalled();
    });

    it('should save to localStorage', async () => {
      formService.createForm.mockResolvedValue({ formId: 'new-form' });

      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            formData: { title: 'Test', description: 'Description' },
            questions: [],
            currentFormId: null,
            activeTab: 'layout',
            errors: {}
          }
        }
      });

      await store.dispatch(saveAsDraft());
      
      const savedForms = JSON.parse(localStorage.getItem('saved_forms'));
      expect(savedForms).toHaveLength(1);
      expect(savedForms[0].formId).toBe('new-form');
      expect(savedForms[0].title).toBe('Test');
    });

    it('should update existing form in localStorage', async () => {
      localStorage.setItem('saved_forms', JSON.stringify([
        { formId: 'existing', title: 'Old Title' }
      ]));

      formService.updateFormConfig.mockResolvedValue({});

      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            formData: { title: 'New Title', description: 'Description' },
            questions: [],
            currentFormId: 'existing',
            activeTab: 'layout',
            errors: {}
          }
        }
      });

      await store.dispatch(saveAsDraft());
      
      const savedForms = JSON.parse(localStorage.getItem('saved_forms'));
      expect(savedForms).toHaveLength(1);
      expect(savedForms[0].title).toBe('New Title');
    });

    it('should handle save error', async () => {
      formService.createForm.mockRejectedValue(new Error('Save failed'));

      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            formData: { title: 'Test', description: 'Description' },
            questions: [],
            currentFormId: null,
            activeTab: 'layout',
            errors: {}
          }
        }
      });

      await expect(store.dispatch(saveAsDraft())).rejects.toThrow();
      expect(toast.error).toHaveBeenCalledWith('Failed to save form. Please try again.');
    });
  });

  describe('saveLayoutAsDraft', () => {
    it('should show error when no currentFormId', async () => {
      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            formData: { title: 'Test', description: 'Description' },
            questions: [],
            currentFormId: null,
            errors: {}
          }
        }
      });

      await store.dispatch(saveLayoutAsDraft());
      expect(toast.error).toHaveBeenCalledWith('Please save form configuration first');
    });

    it('should show error when no questions', async () => {
      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            formData: { title: 'Test', description: 'Description' },
            questions: [],
            currentFormId: 'form123',
            errors: {}
          }
        }
      });

      await store.dispatch(saveLayoutAsDraft());
      expect(toast.error).toHaveBeenCalledWith('Please add at least one question');
    });

    it('should save layout successfully', async () => {
      formService.updateForm.mockResolvedValue({});

      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            formData: { title: 'Test', description: 'Description' },
            questions: [
              {
                _id: 'q1',
                question: 'Question 1',
                type: 'text',
                options: [{ value: 'Option 1' }],
                required: true,
                description: 'Desc',
                description_enabled: true,
                single_choice: true,
                multiple_choice: false,
                format: 'email',
                maxLength: 100,
                enabled: true,
                order: 0
              }
            ],
            currentFormId: 'form123',
            errors: {}
          }
        }
      });

      await store.dispatch(saveLayoutAsDraft());
      
      expect(formService.updateForm).toHaveBeenCalledWith('form123', {
        questions: expect.arrayContaining([
          expect.objectContaining({
            id: 'q1',
            text: 'Question 1',
            type: 'text',
            required: true
          })
        ])
      });
      expect(toast.success).toHaveBeenCalledWith('Form saved as draft successfully!');
    });

    it('should handle various question formats', async () => {
      formService.updateForm.mockResolvedValue({});

      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            formData: { title: 'Test', description: 'Description' },
            questions: [
              { questionId: 'q1', questionText: 'Text 1' },
              { id: 'q2', question: 'Text 2' },
              { question: 'Text 3' }
            ],
            currentFormId: 'form123',
            errors: {}
          }
        }
      });

      await store.dispatch(saveLayoutAsDraft());
      
      const calledQuestions = formService.updateForm.mock.calls[0][1].questions;
      expect(calledQuestions[0].id).toBe('q1');
      expect(calledQuestions[0].text).toBe('Text 1');
      expect(calledQuestions[1].id).toBe('q2');
      expect(calledQuestions[1].text).toBe('Text 2');
      expect(calledQuestions[2].text).toBe('Text 3');
    });

    it('should save to localStorage', async () => {
      formService.updateForm.mockResolvedValue({});

      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            formData: { title: 'Test', description: 'Description' },
            questions: [{ question: 'Q1' }],
            currentFormId: 'form123',
            errors: {}
          }
        }
      });

      await store.dispatch(saveLayoutAsDraft());
      
      const savedForms = JSON.parse(localStorage.getItem('saved_forms'));
      expect(savedForms).toHaveLength(1);
      expect(savedForms[0].formId).toBe('form123');
    });

    it('should handle save error', async () => {
      formService.updateForm.mockRejectedValue(new Error('Save failed'));

      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            formData: { title: 'Test', description: 'Description' },
            questions: [{ question: 'Q1' }],
            currentFormId: 'form123',
            errors: {}
          }
        }
      });

      await expect(store.dispatch(saveLayoutAsDraft())).rejects.toThrow();
      expect(toast.error).toHaveBeenCalledWith('Failed to save form as draft.');
    });
  });

  describe('publishForm', () => {
    const mockNavigate = jest.fn();

    it('should show error when no currentFormId', async () => {
      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            currentFormId: null,
            questions: [],
            errors: {}
          }
        }
      });

      await store.dispatch(publishForm(mockNavigate));
      expect(toast.error).toHaveBeenCalledWith('Please save form first');
    });

    it('should show error when no questions', async () => {
      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            currentFormId: 'form123',
            questions: [],
            errors: {}
          }
        }
      });

      await store.dispatch(publishForm(mockNavigate));
      expect(toast.error).toHaveBeenCalledWith('Cannot publish form without questions. Please add at least one question.');
    });

    it('should publish form successfully', async () => {
      formService.updateForm.mockResolvedValue({});
      formService.publishForm.mockResolvedValue({});

      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            currentFormId: 'form123',
            questions: [
              {
                _id: 'q1',
                question: 'Question 1',
                type: 'text',
                required: true
              }
            ],
            errors: {}
          }
        }
      });

      await store.dispatch(publishForm(mockNavigate));
      
      expect(formService.updateForm).toHaveBeenCalled();
      expect(formService.publishForm).toHaveBeenCalledWith('form123');
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });

    it('should handle publish error', async () => {
      formService.updateForm.mockResolvedValue({});
      formService.publishForm.mockRejectedValue({
        response: { data: { message: 'Publish failed' } }
      });

      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            currentFormId: 'form123',
            questions: [{ question: 'Q1' }],
            errors: {}
          }
        }
      });

      await expect(store.dispatch(publishForm(mockNavigate))).rejects.toThrow();
      expect(toast.error).toHaveBeenCalledWith('Failed to publish form. Publish failed');
    });

    it('should handle publish error without message', async () => {
      formService.updateForm.mockResolvedValue({});
      formService.publishForm.mockRejectedValue(new Error('Network error'));

      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            currentFormId: 'form123',
            questions: [{ question: 'Q1' }],
            errors: {}
          }
        }
      });

      await expect(store.dispatch(publishForm(mockNavigate))).rejects.toThrow();
      expect(toast.error).toHaveBeenCalledWith('Failed to publish form. ');
    });
  });

  describe('proceedToLayout', () => {
    it('should validate and show errors', async () => {
      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            formData: { title: '', description: '' },
            currentFormId: null,
            errors: {},
            TITLE_CHAR_LIMIT: 80,
            DESCRIPTION_CHAR_LIMIT: 200
          }
        }
      });

      await store.dispatch(proceedToLayout());
      
      const state = store.getState().formBuilder;
      expect(state.errors.title).toBeDefined();
      expect(formService.createForm).not.toHaveBeenCalled();
    });

    it('should create new form and proceed', async () => {
      formService.createForm.mockResolvedValue({ formId: 'new-form' });

      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            formData: { title: 'Valid Title', description: 'Valid Description here' },
            currentFormId: null,
            errors: {},
            activeTab: 'config',
            TITLE_CHAR_LIMIT: 80,
            DESCRIPTION_CHAR_LIMIT: 200
          }
        }
      });

      await store.dispatch(proceedToLayout());
      
      expect(formService.createForm).toHaveBeenCalled();
      expect(store.getState().formBuilder.currentFormId).toBe('new-form');
    });

    it('should update existing form and proceed', async () => {
      formService.updateFormConfig.mockResolvedValue({});

      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            formData: { title: 'Valid Title', description: 'Valid Description here' },
            currentFormId: 'existing-form',
            errors: {},
            activeTab: 'config',
            TITLE_CHAR_LIMIT: 80,
            DESCRIPTION_CHAR_LIMIT: 200
          }
        }
      });

      await store.dispatch(proceedToLayout());
      
      expect(formService.updateFormConfig).toHaveBeenCalledWith('existing-form', expect.any(Object));
    });

    it('should handle error during save', async () => {
      formService.createForm.mockRejectedValue(new Error('Save failed'));

      store = configureStore({
        reducer: {
          formBuilder: formBuilderReducer
        },
        preloadedState: {
          formBuilder: {
            formData: { title: 'Valid Title', description: 'Valid Description here' },
            currentFormId: null,
            errors: {},
            TITLE_CHAR_LIMIT: 80,
            DESCRIPTION_CHAR_LIMIT: 200
          }
        }
      });

      await expect(store.dispatch(proceedToLayout())).rejects.toThrow();
      expect(toast.error).toHaveBeenCalledWith('Failed to save form configuration.');
    });
  });
});