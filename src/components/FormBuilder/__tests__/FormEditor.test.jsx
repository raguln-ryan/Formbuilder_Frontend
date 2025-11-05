import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import FormEditor from '../FormEditor';
import formService from '../../../services/formService';
import toast from 'react-hot-toast';
import * as AuthContext from '../../../contexts/AuthContext';

// Mock dependencies
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

jest.mock('react-hot-toast');
jest.mock('../../../services/formService');
jest.mock('../../../styles/components/FormBuilder/FormEditor.css', () => ({}));

// Mock child components
jest.mock('../FormConfig', () => {
  return function MockFormConfig({ onInputChange, onSaveAsDraft, onNext, formData }) {
    return (
      <div data-testid="form-config">
        <input
          data-testid="title-input"
          value={formData.title}
          onChange={(e) => onInputChange('title', e.target.value)}
        />
        <input
          data-testid="description-input"
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
        />
        <button onClick={onSaveAsDraft}>Save Draft</button>
        <button onClick={onNext}>Next</button>
      </div>
    );
  };
});

jest.mock('../FormLayout', () => {
  return function MockFormLayout({ questions, onQuestionsChange, onSaveAsDraft, onPublish }) {
    return (
      <div data-testid="form-layout">
        <button onClick={() => onQuestionsChange([...questions, { id: 'new' }])}>
          Add Question
        </button>
        <button onClick={onSaveAsDraft}>Save Layout Draft</button>
        <button onClick={onPublish}>Publish</button>
      </div>
    );
  };
});

jest.mock('../../Common/LoadingSpinner', () => {
  return function MockLoadingSpinner({ message }) {
    return <div data-testid="loading-spinner">{message}</div>;
  };
});

// Mock Redux store
const createMockStore = (initialState = {}) => {
  const mockDispatch = jest.fn();
  
  return {
    store: configureStore({
      reducer: {
        formBuilder: (state = {
          formData: { title: 'Test', description: 'Test Desc' },
          questions: [{ _id: 'q1', question: 'Question 1' }],
          currentFormId: null,
          activeTab: 'config',
          loading: false,
          saving: false,
          errors: {},
          TITLE_CHAR_LIMIT: 100,
          DESCRIPTION_CHAR_LIMIT: 500,
          ...initialState
        }, action) => {
          if (action.type === 'formBuilder/setActiveTab') {
            return { ...state, activeTab: action.payload };
          }
          if (action.type === 'formBuilder/setFormField') {
            return { 
              ...state, 
              formData: { ...state.formData, [action.payload.field]: action.payload.value } 
            };
          }
          if (action.type === 'formBuilder/setQuestions') {
            return { ...state, questions: action.payload };
          }
          if (action.type === 'formBuilder/setCurrentFormId') {
            return { ...state, currentFormId: action.payload };
          }
          if (action.type === 'formBuilder/setFormData') {
            return { ...state, formData: action.payload };
          }
          if (action.type === 'formBuilder/setSaving') {
            return { ...state, saving: action.payload };
          }
          if (action.type === 'formBuilder/setLoading') {
            return { ...state, loading: action.payload };
          }
          if (action.type === 'formBuilder/validateFormConfig') {
            return state;
          }
          if (action.type === 'formBuilder/resetForm') {
            return initialState;
          }
          return state;
        }
      }
    }),
    dispatch: mockDispatch
  };
};

// Mock auth context
const mockUseAuth = {
  user: { role: 'Admin' },
  isAuthenticated: true
};

describe('FormEditor', () => {
  let mockStore;
  let mockDispatch;

  beforeEach(() => {
    jest.clearAllMocks();
    const storeData = createMockStore();
    mockStore = storeData.store;
    mockDispatch = storeData.dispatch;
    
    jest.spyOn(AuthContext, 'useAuth').mockImplementation(() => mockUseAuth);
    
    // Setup default service responses
    formService.getFormById.mockResolvedValue({
      title: 'Existing Form',
      description: 'Existing Description',
      questions: [{ _id: 'q1', question: 'Q1' }]
    });
    formService.createForm.mockResolvedValue({ formId: 'new-form-id' });
    formService.updateFormConfig.mockResolvedValue({ success: true });
    formService.updateForm.mockResolvedValue({ success: true });
    formService.publishForm.mockResolvedValue({ success: true });
  });

  test('renders form editor with config tab by default', () => {
    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('form-config')).toBeInTheDocument();
    expect(screen.getByText('Form Configuration')).toHaveClass('tab-active');
  });

  test('redirects when not authenticated', () => {
    jest.spyOn(AuthContext, 'useAuth').mockImplementation(() => ({
      user: null,
      isAuthenticated: false
    }));

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('redirects when user is not admin', () => {
    jest.spyOn(AuthContext, 'useAuth').mockImplementation(() => ({
      user: { role: 'User' },
      isAuthenticated: true
    }));

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('fetches form data when editing existing form', async () => {
    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor formId="existing-form-id" />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(formService.getFormById).toHaveBeenCalledWith('existing-form-id');
    });
  });

  test('handles fetch form data error', async () => {
    formService.getFormById.mockRejectedValue(new Error('Fetch failed'));
    window.alert = jest.fn();

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor formId="existing-form-id" />
        </BrowserRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to load form data');
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  test('does not fetch data for new form', () => {
    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor formId="new" />
        </BrowserRouter>
      </Provider>
    );

    expect(formService.getFormById).not.toHaveBeenCalled();
  });

  test('handles input change', () => {
    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const titleInput = screen.getByTestId('title-input');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
  });

  test('handles save as draft with empty fields', async () => {
    mockStore = createMockStore({
      formData: { title: '', description: '' }
    }).store;

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const saveButton = screen.getByText('Save Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please fill in all required fields');
    });
  });

  test('handles save as draft for new form', async () => {
    const mockLocalStorage = {
      getItem: jest.fn(() => '[]'),
      setItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const saveButton = screen.getByText('Save Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(formService.createForm).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Form saved as draft successfully!');
    });
  });

  test('handles save as draft for existing form', async () => {
    mockStore = createMockStore({
      currentFormId: 'existing-id'
    }).store;

    const mockLocalStorage = {
      getItem: jest.fn(() => JSON.stringify([{ formId: 'existing-id' }])),
      setItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const saveButton = screen.getByText('Save Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(formService.updateFormConfig).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Form saved as draft successfully!');
    });
  });

  test('handles save as draft error', async () => {
    formService.createForm.mockRejectedValue(new Error('Save failed'));

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const saveButton = screen.getByText('Save Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save form. Please try again.');
    });
  });

  test('handles next button with empty fields', async () => {
    mockStore = createMockStore({
      formData: { title: '', description: '' }
    }).store;

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please fill in all required fields');
    });
  });

  test('handles next button for new form', async () => {
    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(formService.createForm).toHaveBeenCalled();
    });
  });

  test('handles next button for existing form', async () => {
    mockStore = createMockStore({
      currentFormId: 'existing-id'
    }).store;

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(formService.updateFormConfig).toHaveBeenCalled();
    });
  });

  test('handles next button error', async () => {
    formService.createForm.mockRejectedValue(new Error('Create failed'));

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save form configuration.');
    });
  });

  test('switches to layout tab', async () => {
    mockStore = createMockStore({
      activeTab: 'layout',
      currentFormId: 'form-id'
    }).store;

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('form-layout')).toBeInTheDocument();
  });

  test('handles save layout as draft without form id', async () => {
    mockStore = createMockStore({
      activeTab: 'layout',
      currentFormId: null
    }).store;

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const saveButton = screen.getByText('Save Layout Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please save form configuration first');
    });
  });

  test('handles save layout as draft without questions', async () => {
    mockStore = createMockStore({
      activeTab: 'layout',
      currentFormId: 'form-id',
      questions: []
    }).store;

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const saveButton = screen.getByText('Save Layout Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please add at least one question');
    });
  });

  test('handles save layout as draft successfully', async () => {
    mockStore = createMockStore({
      activeTab: 'layout',
      currentFormId: 'form-id',
      questions: [
        {
          _id: 'q1',
          question: 'Question 1',
          type: 'text',
          options: [{ value: 'Option 1' }],
          required: true,
          description: 'Desc',
          maxLength: 100,
          enabled: true,
          description_enabled: true,
          single_choice: true,
          multiple_choice: false,
          format: 'text',
          order: 0
        }
      ]
    }).store;

    const mockLocalStorage = {
      getItem: jest.fn(() => '[]'),
      setItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const saveButton = screen.getByText('Save Layout Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(formService.updateForm).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Form saved as draft successfully!');
    });
  });

  test('handles save layout with existing localStorage data', async () => {
    mockStore = createMockStore({
      activeTab: 'layout',
      currentFormId: 'form-id',
      questions: [{ questionId: 'q1', text: 'Q1' }]
    }).store;

    const mockLocalStorage = {
      getItem: jest.fn(() => JSON.stringify([{ formId: 'form-id' }])),
      setItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const saveButton = screen.getByText('Save Layout Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  test('handles save layout as draft error', async () => {
    mockStore = createMockStore({
      activeTab: 'layout',
      currentFormId: 'form-id',
      questions: [{ id: 'q1', questionText: 'Q1' }]
    }).store;

    formService.updateForm.mockRejectedValue(new Error('Update failed'));

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const saveButton = screen.getByText('Save Layout Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save form as draft.');
    });
  });

  test('handles publish without form id', async () => {
    mockStore = createMockStore({
      activeTab: 'layout',
      currentFormId: null
    }).store;

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please save form first');
    });
  });

  test('handles publish without questions', async () => {
    mockStore = createMockStore({
      activeTab: 'layout',
      currentFormId: 'form-id',
      questions: []
    }).store;

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Cannot publish form without questions. Please add at least one question.');
    });
  });

  test('handles publish successfully', async () => {
    mockStore = createMockStore({
      activeTab: 'layout',
      currentFormId: 'form-id',
      questions: [{ _id: 'q1', question: 'Q1' }]
    }).store;

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(formService.updateForm).toHaveBeenCalled();
      expect(formService.publishForm).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  test('handles publish with null questions', async () => {
    mockStore = createMockStore({
      activeTab: 'layout',
      currentFormId: 'form-id',
      questions: null
    }).store;

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Cannot publish form without questions. Please add at least one question.');
    });
  });

  test('handles publish error with response message', async () => {
    mockStore = createMockStore({
      activeTab: 'layout',
      currentFormId: 'form-id',
      questions: [{ _id: 'q1' }]
    }).store;

    formService.updateForm.mockRejectedValue({
      response: { data: { message: 'Custom error message' } }
    });

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to publish form. Custom error message');
    });
  });

  test('handles publish error without response message', async () => {
    mockStore = createMockStore({
      activeTab: 'layout',
      currentFormId: 'form-id',
      questions: [{ _id: 'q1' }]
    }).store;

    formService.updateForm.mockRejectedValue(new Error('Network error'));

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to publish form. ');
    });
  });

  test('handles questions change', () => {
    mockStore = createMockStore({
      activeTab: 'layout'
    }).store;

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const addButton = screen.getByText('Add Question');
    fireEvent.click(addButton);
  });

  test('renders loading spinner when loading', () => {
    mockStore = createMockStore({
      loading: true
    }).store;

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading form...')).toBeInTheDocument();
  });

  test('disables layout tab when no form id and no title', () => {
    mockStore = createMockStore({
      currentFormId: null,
      formData: { title: '', description: '' }
    }).store;

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const layoutTab = screen.getByText('Form Layout');
    expect(layoutTab).toHaveClass('tab-disabled');
    expect(layoutTab).toBeDisabled();
  });

  test('enables layout tab when form has title', () => {
    mockStore = createMockStore({
      currentFormId: null,
      formData: { title: 'Test Form', description: '' }
    }).store;

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const layoutTab = screen.getByText('Form Layout');
    expect(layoutTab).not.toHaveClass('tab-disabled');
  });

  test('cleans up on unmount', () => {
    const { unmount } = render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    unmount();
  });

  test('saves questions with localStorage for new form', async () => {
    const mockLocalStorage = {
      getItem: jest.fn(() => '[]'),
      setItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

    mockStore = createMockStore({
      currentFormId: 'form-id',
      questions: [{ _id: 'q1', question: 'Q1' }]
    }).store;

    render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormEditor />
        </BrowserRouter>
      </Provider>
    );

    const saveButton = screen.getByText('Save Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(formService.updateForm).toHaveBeenCalled();
    });
  });
});
