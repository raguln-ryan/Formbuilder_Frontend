import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import ViewFormPage from '../ViewFormPage';
import toast from 'react-hot-toast';
import responseService from '../../services/responseService';
import { 
  fetchFormDetails, 
  updateForm, 
  updateFormData, 
  updateQuestions 
} from '../../store/slices/formSlice';
import { fetchResponses } from '../../store/slices/responseSlice';

// Mock dependencies
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ formId: 'test-form-123' }),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: { activeTab: 'configuration' } })
}));

jest.mock('react-hot-toast');
jest.mock('../../services/responseService');

// Mock components
jest.mock('../../components/Common/NavigationBar', () => {
  return function MockNavigationBar() {
    return <div data-testid="navigation-bar">Navigation Bar</div>;
  };
});

jest.mock('../../components/Common/LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

jest.mock('../../components/FormBuilder/FormConfig', () => {
  return function MockFormConfig({ onInputChange, onSaveAsDraft, onNext, formData }) {
    return (
      <div data-testid="form-config">
        <input
          data-testid="title-input"
          value={formData.title}
          onChange={(e) => onInputChange('title', e.target.value)}
        />
        <button onClick={onSaveAsDraft}>Save</button>
        <button onClick={onNext}>Next</button>
      </div>
    );
  };
});

jest.mock('../../components/FormBuilder/SectionEditor', () => {
  return function MockSectionEditor({ questions, onQuestionsChange }) {
    return (
      <div data-testid="section-editor">
        <button onClick={() => onQuestionsChange([...questions, { id: 'new' }])}>
          Add Question
        </button>
      </div>
    );
  };
});

jest.mock('../../components/FormBuilder/QuestionPreview', () => {
  return function MockQuestionPreview({ formTitle, formDescription, questions }) {
    return (
      <div data-testid="question-preview">
        Preview: {formTitle}
      </div>
    );
  };
});

// Mock store slices
jest.mock('../../store/slices/formSlice', () => ({
  fetchFormDetails: jest.fn(),
  updateForm: jest.fn(),
  updateFormData: jest.fn(),
  updateQuestions: jest.fn()
}));

jest.mock('../../store/slices/responseSlice', () => ({
  fetchResponses: jest.fn()
}));

// Mock styles
jest.mock('../../styles/components/FormBuilder/FormEditor.css', () => ({}));
jest.mock('../../styles/pages/ViewFormPage.css', () => ({}));

// Mock image assets
jest.mock('../../assets/character.png', () => 'character.png');
jest.mock('../../assets/character1.png', () => 'character1.png');
jest.mock('../../assets/speech-bubbles.png', () => 'speech-bubbles.png');
jest.mock('../../assets/round.png', () => 'round.png');

// Create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      forms: (state = {
        formData: { title: 'Test Form', description: 'Test Description', status: 0 },
        questions: [
          {
            _id: 'q1',
            id: 'q1',
            questionId: 'q1',
            type: 'short_text',
            question: 'Question 1',
            text: 'Question 1',
            questionText: 'Question 1',
            required: true,
            description: 'Description 1',
            description_enabled: true,
            options: []
          },
          {
            _id: 'q2',
            type: 'checkbox',
            question: 'Question 2',
            options: [
              { id: 'opt1', value: 'Option 1', optionId: 'opt1' },
              { id: 'opt2', value: 'Option 2' }
            ]
          },
          {
            _id: 'q3',
            type: 'file_upload',
            question: 'Upload File'
          },
          {
            _id: 'q4',
            type: 'date',
            question: 'Date Question'
          }
        ],
        loading: false,
        saving: false,
        lastFetchedFormId: 'test-form-123',
        ...initialState.forms
      }, action) => state,
      responses: (state = {
        responses: [
          {
            id: 'resp1',
            user: { name: 'John Doe', email: 'john@test.com' },
            userId: 'user1',
            submittedBy: 'John Doe',
            submittedAt: '2024-01-01T10:00:00Z',
            email: 'john@test.com',
            details: [
              { questionId: 'q1', answer: 'Answer 1' },
              { questionId: 'q2', answer: '["opt1","opt2"]' },
              { questionId: 'q3', answer: '[FILE_UPLOADED:test.pdf]' },
              { questionId: 'q4', answer: '2024-01-01' }
            ],
            answers: [
              { questionId: 'q1', answer: 'Answer 1', value: 'Answer 1' }
            ]
          }
        ],
        totalItems: 1,
        loading: false,
        ...initialState.responses
      }, action) => state
    }
  });
};

describe('ViewFormPage', () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore();
    fetchFormDetails.mockReturnValue({ type: 'forms/fetchFormDetails' });
    fetchResponses.mockReturnValue({ type: 'responses/fetchResponses' });
    updateForm.mockReturnValue({ type: 'forms/updateForm' });
    updateFormData.mockReturnValue({ type: 'forms/updateFormData' });
    updateQuestions.mockReturnValue({ type: 'forms/updateQuestions' });
    responseService.exportToCSV.mockResolvedValue({ success: true });
  });

  // Test initial render and loading state
  test('renders loading state when loading is true', () => {
    store = createMockStore({
      forms: {
        formData: {},
        questions: [],
        loading: true,
        saving: false
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders form editor page with configuration tab by default', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByTestId('form-config')).toBeInTheDocument();
    expect(screen.getByText('Form Configuration')).toHaveClass('active');
  });

  test('handles invalid activeTab in location state', () => {
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
      state: { activeTab: 'invalid-tab' }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Form Configuration')).toHaveClass('active');
  });

  test('handles null location state', () => {
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
      state: null
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Form Configuration')).toHaveClass('active');
  });

  test('switches to layout tab', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const layoutTab = screen.getByText('Form Layout');
    fireEvent.click(layoutTab);

    await waitFor(() => {
      expect(screen.getByTestId('section-editor')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  test('renders empty questions message in layout tab', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test', description: 'Test' },
        questions: [],
        loading: false
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const layoutTab = screen.getByText('Form Layout');
    fireEvent.click(layoutTab);

    await waitFor(() => {
      expect(screen.getByText('Loading questions...')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  test('switches to responses tab and fetches responses', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      expect(fetchResponses).toHaveBeenCalled();
    }, { timeout: 200 });
  });

  test('shows empty responses state', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test', description: 'Test' },
        questions: [{ _id: 'q1', question: 'Question 1' }]
      },
      responses: {
        responses: [],
        totalItems: 0
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      expect(screen.getByText('No responses yet')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  test('handles input change in form configuration', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const titleInput = screen.getByTestId('title-input');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    expect(updateFormData).toHaveBeenCalledWith({ title: 'New Title' });
  });

  test('handles save with empty title', async () => {
    store = createMockStore({
      forms: {
        formData: { title: '', description: 'Test' },
        questions: []
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const saveButton = screen.getAllByText('Save')[0];
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Form title is required');
    });
  });

  test('handles successful save', async () => {
    updateForm.mockReturnValue({
      type: 'forms/updateForm/fulfilled',
      fulfilled: { match: () => true }
    });
    updateForm.fulfilled = { match: () => true };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const saveButton = screen.getAllByText('Save')[0];
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Form saved successfully!');
    });
  });

  test('handles failed save', async () => {
    updateForm.mockReturnValue({
      type: 'forms/updateForm/rejected',
      fulfilled: { match: () => false }
    });
    updateForm.fulfilled = { match: () => false };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const saveButton = screen.getAllByText('Save')[0];
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save form');
    });
  });

  test('handles save error with exception', async () => {
    updateForm.mockRejectedValue(new Error('Network error'));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const saveButton = screen.getAllByText('Save')[0];
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save form: Network error');
    });
  });

  test('handles questions change', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const layoutTab = screen.getByText('Form Layout');
    fireEvent.click(layoutTab);

    await waitFor(() => {
      const addButton = screen.getByText('Add Question');
      fireEvent.click(addButton);
      expect(updateQuestions).toHaveBeenCalled();
    }, { timeout: 200 });
  });

  test('fixes questions without question property', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test', description: 'Test' },
        questions: [
          { _id: 'q1', questionText: 'Text Question', text: null, title: null },
          { _id: 'q2', text: 'Another Question', questionText: null },
          { _id: 'q3', title: 'Title Question' }
        ]
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const layoutTab = screen.getByText('Form Layout');
    fireEvent.click(layoutTab);

    await waitFor(() => {
      const addButton = screen.getByText('Add Question');
      fireEvent.click(addButton);
      
      const callArg = updateQuestions.mock.calls[0][0];
      expect(callArg[0].question).toBe('Text Question');
      expect(callArg[1].question).toBe('Another Question');
      expect(callArg[2].question).toBe('Title Question');
    }, { timeout: 200 });
  });

  test('opens and closes preview modal', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const layoutTab = screen.getByText('Form Layout');
    fireEvent.click(layoutTab);

    await waitFor(() => {
      const previewButton = screen.getByText('Preview Form');
      fireEvent.click(previewButton);
    }, { timeout: 200 });

    await waitFor(() => {
      expect(screen.getByTestId('question-preview')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('question-preview')).not.toBeInTheDocument();
    });
  });

  test('handles search in responses', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by Name/User ID');
      fireEvent.change(searchInput, { target: { value: 'John' } });
      fireEvent.keyPress(searchInput, { key: 'Enter', code: 13, charCode: 13 });
    }, { timeout: 200 });

    expect(fetchResponses).toHaveBeenCalledWith({
      formId: 'test-form-123',
      page: 1,
      pageSize: 10,
      searchTerm: 'John'
    });
  });

  test('handles export to CSV', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const exportButton = screen.getByText('📊 Export to Excel');
      fireEvent.click(exportButton);
    }, { timeout: 200 });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Responses exported successfully!');
    });
  });

  test('handles export to CSV error', async () => {
    responseService.exportToCSV.mockRejectedValue(new Error('Export failed'));

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const exportButton = screen.getByText('📊 Export to Excel');
      fireEvent.click(exportButton);
    }, { timeout: 200 });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to export responses');
    });
  });

  test('handles sorting in responses table', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const submittedByHeader = screen.getByText(/Submitted By/);
      fireEvent.click(submittedByHeader);
    }, { timeout: 200 });

    await waitFor(() => {
      const submittedByHeader = screen.getByText(/Submitted By/);
      fireEvent.click(submittedByHeader);
    }, { timeout: 200 });
  });

  test('switches to individual response view', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const viewButton = screen.getByText('View');
      fireEvent.click(viewButton);
    }, { timeout: 200 });

    await waitFor(() => {
      const individualTab = screen.getByText('Individual Response');
      fireEvent.click(individualTab);
    }, { timeout: 200 });
  });

  test('shows individual response details', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const individualTab = screen.getByText('Individual Response');
      fireEvent.click(individualTab);
    }, { timeout: 200 });

    await waitFor(() => {
      const responseEntry = screen.getByText('John Doe');
      fireEvent.click(responseEntry);
    }, { timeout: 200 });
  });

  test('handles back button in individual response view', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const viewButton = screen.getByText('View');
      fireEvent.click(viewButton);
    }, { timeout: 200 });

    await waitFor(() => {
      const backButton = screen.getByText('← Back to summary');
      fireEvent.click(backButton);
    }, { timeout: 200 });
  });

  test('handles pagination controls', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const itemsSelect = screen.getByDisplayValue('10');
      fireEvent.change(itemsSelect, { target: { value: '25' } });
    }, { timeout: 200 });

    await waitFor(() => {
      const pageSelect = screen.getByDisplayValue('1');
      fireEvent.change(pageSelect, { target: { value: '1' } });
    }, { timeout: 200 });

    await waitFor(() => {
      const nextButton = screen.getByText('❯');
      fireEvent.click(nextButton);
    }, { timeout: 200 });

    await waitFor(() => {
      const prevButton = screen.getByText('❮');
      fireEvent.click(prevButton);
    }, { timeout: 200 });
  });

  test('handles answer with JSON parse error', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test', description: 'Test' },
        questions: [{ _id: 'q1', type: 'checkbox', question: 'Q1', options: [] }]
      },
      responses: {
        responses: [{
          id: 'resp1',
          details: [{ questionId: 'q1', answer: '[invalid json' }]
        }]
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const viewButton = screen.getByText('View');
      fireEvent.click(viewButton);
    }, { timeout: 200 });
  });

  test('handles different answer formats', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test', description: 'Test' },
        questions: [
          { _id: 'q1', type: 'checkbox', question: 'Q1', options: [{ id: 'opt1', value: 'Option 1' }] },
          { _id: 'q2', type: 'date_picker', question: 'Q2' },
          { _id: 'q3', type: 'file', question: 'Q3' },
          { _id: 'q4', type: 'radio', question: 'Q4', options: [] },
          { _id: 'q5', type: 'dropdown', question: 'Q5', options: [] }
        ]
      },
      responses: {
        responses: [{
          id: 'resp1',
          details: [
            { questionId: 'q1', answer: 'opt1, opt2' },
            { questionId: 'q2', answer: '2024-01-01' },
            { questionId: 'q3', answer: '' },
            { questionId: 'q4', answer: null },
            { questionId: 'q5', answer: undefined }
          ]
        }]
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const viewButton = screen.getByText('View');
      fireEvent.click(viewButton);
    }, { timeout: 200 });
  });
    test('renders questions without details in individual response', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test Form', description: 'Test' },
        questions: [
          { _id: 'q1', question: 'Question 1', type: 'short_text' },
          { _id: 'q2', question: 'Question 2', type: 'long_text' },
          { _id: 'q3', question: 'Question 3', type: 'paragraph' }
        ]
      },
      responses: {
        responses: [{
          id: 'resp1',
          submittedBy: 'User',
          submittedAt: '2024-01-01',
          details: null,
          answers: null
        }]
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const viewButton = screen.getByText('View');
      fireEvent.click(viewButton);
    }, { timeout: 200 });
  });

  test('handles individual response with no questions', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test Form', description: 'Test' },
        questions: []
      },
      responses: {
        responses: [{
          id: 'resp1',
          submittedBy: 'User',
          submittedAt: '2024-01-01'
        }]
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const viewButton = screen.getByText('View');
      fireEvent.click(viewButton);
    }, { timeout: 200 });

    await waitFor(() => {
      expect(screen.getByText('No questions available for this form.')).toBeInTheDocument();
    });
  });

  test('handles empty responses list in individual view', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test Form', description: 'Test' },
        questions: [{ _id: 'q1', question: 'Question 1' }]
      },
      responses: {
        responses: [],
        totalItems: 0
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const individualTab = screen.getByText('Individual Response');
      fireEvent.click(individualTab);
    }, { timeout: 200 });

    await waitFor(() => {
      expect(screen.getByText('No responses yet')).toBeInTheDocument();
    });
  });

  test('handles response with missing user data', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test Form', description: 'Test' },
        questions: [{ _id: 'q1', question: 'Question 1' }]
      },
      responses: {
        responses: [{
          id: 'resp1',
          submittedBy: null,
          user: null,
          userId: null,
          email: null,
          submittedAt: null,
          details: []
        }]
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  test('handles date formatting with invalid dates', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test Form', description: 'Test' },
        questions: [{ _id: 'q1', type: 'date', question: 'Date Question' }]
      },
      responses: {
        responses: [{
          id: 'resp1',
          submittedAt: 'invalid-date',
          details: [{ questionId: 'q1', answer: 'invalid-date' }]
        }]
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      expect(screen.getByText('View')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  test('handles questions with different id formats', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test Form', description: 'Test' },
        questions: [
          { id: 'q1', question: 'Question 1' },
          { questionId: 'q2', question: 'Question 2' },
          { _id: 'q3', question: 'Question 3' }
        ]
      },
      responses: {
        responses: [{
          id: 'resp1',
          details: [
            { questionId: 'q1', answer: 'Answer 1' },
            { questionId: 'q2', answer: 'Answer 2' },
            { questionId: 'q3', answer: 'Answer 3' }
          ],
          answers: [
            { questionId: 'q1', value: 'Value 1' }
          ]
        }]
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const viewButton = screen.getByText('View');
      fireEvent.click(viewButton);
    }, { timeout: 200 });
  });

  test('handles sorting by different fields', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test Form', description: 'Test' },
        questions: []
      },
      responses: {
        responses: [
          { id: 'resp1', submittedBy: 'A', userId: '1', submittedAt: '2024-01-01' },
          { id: 'resp2', submittedBy: 'B', userId: '2', submittedAt: '2024-01-02' }
        ]
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const userIdHeader = screen.getByText(/User ID/);
      fireEvent.click(userIdHeader);
    }, { timeout: 200 });

    await waitFor(() => {
      const submittedOnHeader = screen.getByText(/Submitted On/);
      fireEvent.click(submittedOnHeader);
    }, { timeout: 200 });
  });

  test('handles pagination with zero total items', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test Form', description: 'Test' },
        questions: []
      },
      responses: {
        responses: [],
        totalItems: 0
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      expect(screen.getByText('0 items')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  test('handles pagination at last page', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test Form', description: 'Test' },
        questions: []
      },
      responses: {
        responses: Array(10).fill(null).map((_, i) => ({
          id: `resp${i}`,
          submittedBy: `User ${i}`,
          submittedAt: '2024-01-01'
        })),
        totalItems: 10
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const nextButton = screen.getByText('❯');
      expect(nextButton).toBeDisabled();
    }, { timeout: 200 });
  });

  test('handles search with special characters', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by Name/User ID');
      fireEvent.change(searchInput, { target: { value: 'test@email.com' } });
      fireEvent.keyPress(searchInput, { key: 'A' }); // Non-Enter key
    }, { timeout: 200 });
  });

  test('handles options with different formats', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test Form', description: 'Test' },
        questions: [
          { 
            _id: 'q1', 
            type: 'checkbox', 
            question: 'Question 1',
            options: [
              { id: 'opt1', value: 'Option 1', optionId: 'opt1' },
              { id: 'opt2', value: 'Option 2' },
              'Option 3' // String option
            ]
          }
        ]
      },
      responses: {
        responses: [{
          id: 'resp1',
          details: [{ questionId: 'q1', answer: 'opt1,opt2,opt3' }]
        }]
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const viewButton = screen.getByText('View');
      fireEvent.click(viewButton);
    }, { timeout: 200 });
  });

  test('handles response view with selected response', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const individualTab = screen.getByText('Individual Response');
      fireEvent.click(individualTab);
    }, { timeout: 200 });

    await waitFor(() => {
      expect(screen.getByText('Select a response from the left to view details')).toBeInTheDocument();
    });
  });

  test('handles question with long_answer type', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test Form', description: 'Test' },
        questions: [
          { _id: 'q1', type: 'long_answer', question: 'Long Answer', required: false }
        ]
      },
      responses: {
        responses: [{
          id: 'resp1',
          details: [{ questionId: 'q1', answer: 'Long answer text' }]
        }]
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const viewButton = screen.getByText('View');
      fireEvent.click(viewButton);
    }, { timeout: 200 });
  });

  test('handles file upload with no file', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test Form', description: 'Test' },
        questions: [
          { _id: 'q1', type: 'file', question: 'File Upload' }
        ]
      },
      responses: {
        responses: [{
          id: 'resp1',
          details: [{ questionId: 'q1', answer: '' }]
        }]
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      const viewButton = screen.getByText('View');
      fireEvent.click(viewButton);
    }, { timeout: 200 });

    await waitFor(() => {
      expect(screen.getByText('No file uploaded')).toBeInTheDocument();
    });
  });

  test('handles saving when form is already saving', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test Form', description: 'Test' },
        questions: [],
        saving: true
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  test('handles tab change with responses already loaded', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test Form', description: 'Test' },
        questions: []
      },
      responses: {
        responses: [{ id: 'resp1' }],
        totalItems: 1
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await new Promise(resolve => setTimeout(resolve, 150));

    expect(fetchResponses).not.toHaveBeenCalled();
  });

  test('dispatches fetchFormDetails on mount', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    expect(fetchFormDetails).toHaveBeenCalledWith('test-form-123');
  });

  test('handles next button in configuration tab', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(screen.getByTestId('section-editor')).toBeInTheDocument();
  });

  test('filters responses correctly', async () => {
    store = createMockStore({
      forms: {
        formData: { title: 'Test Form', description: 'Test' },
        questions: []
      },
      responses: {
        responses: [
          { id: 'resp1', submittedBy: 'John Doe', userId: '123', email: 'john@test.com' },
          { id: 'resp2', submittedBy: 'Jane Smith', userId: '456', email: 'jane@test.com' }
        ]
      }
    });

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ViewFormPage />
        </BrowserRouter>
      </Provider>
    );

    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 200 });
  });
});
