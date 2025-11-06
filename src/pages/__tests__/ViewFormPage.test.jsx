import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import ViewFormPage from '../ViewFormPage';
import formService from '../../services/formService';
import responseService from '../../services/responseService';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('../../services/formService');
jest.mock('../../services/responseService');
jest.mock('react-hot-toast');
jest.mock('../../components/Common/NavigationBar', () => {
  return function NavigationBar() {
    return <div>NavigationBar</div>;
  };
});
jest.mock('../../components/FormBuilder/FormConfig', () => {
  return function FormConfig({ onNext }) {
    return (
      <div>
        FormConfig
        <button onClick={onNext}>Next</button>
      </div>
    );
  };
});
jest.mock('../../components/FormBuilder/SectionEditor', () => {
  return function SectionEditor() {
    return <div>SectionEditor</div>;
  };
});
jest.mock('../../components/FormBuilder/QuestionPreview', () => {
  return function QuestionPreview() {
    return <div>QuestionPreview</div>;
  };
});
jest.mock('../../components/Common/LoadingSpinner', () => {
  return function LoadingSpinner() {
    return <div>LoadingSpinner</div>;
  };
});

// Mock store slices
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      formBuilder: (state = {
        formData: { title: '', description: '', isVisible: true, status: 0 },
        questions: [],
        loading: false,
        saving: false,
        showPreview: false,
        currentFormId: null,
        ...initialState.formBuilder
      }) => state,
      responses: (state = {
        responses: [],
        totalItems: 0,
        loading: false,
        ...initialState.responses
      }) => state
    }
  });
};

const mockFormData = {
  id: '123',
  title: 'Test Form',
  description: 'Test Description',
  isVisible: true,
  status: 1,
  questions: [
    {
      id: 'q1',
      type: 'short_text',
      text: 'Question 1',
      descriptionEnabled: true,
      description: 'Description 1',
      required: true,
      order: 0,
      enabled: true,
      options: []
    },
    {
      id: 'q2',
      type: 'long_text',
      question: 'Question 2',
      required: false,
      order: 1
    },
    {
      id: 'q3',
      type: 'file_upload',
      questionText: 'Upload File',
      order: 2
    },
    {
      id: 'q4',
      type: 'date',
      text: 'Date Question',
      format: 'MM/DD/YYYY',
      order: 3
    },
    {
      id: 'q5',
      type: 'checkbox',
      text: 'Checkbox Question',
      options: [
        { id: 'opt1', value: 'Option 1' },
        { id: 'opt2', value: 'Option 2' }
      ],
      order: 4
    }
  ]
};

const mockResponses = [
  {
    id: 1,
    submittedBy: 'John Doe',
    userId: 'user123',
    submittedAt: '2024-01-15T10:00:00',
    email: 'john@example.com',
    details: [
      { questionId: 'q1', answer: 'Answer 1' },
      { questionId: 'q2', answer: 'Long answer text' },
      { questionId: 'q3', answer: '[FILE_UPLOADED:document.pdf]' },
      { questionId: 'q4', answer: '2024-01-15' },
      { questionId: 'q5', answer: '["opt1","opt2"]' }
    ]
  },
  {
    id: 2,
    submittedBy: 'Jane Smith',
    userId: 'user456',
    submittedAt: '2024-01-16T14:30:00',
    answers: [
      { questionId: 'q1', answer: 'Answer 2' },
      { questionId: 'q2', value: 'Another long answer' }
    ]
  }
];

const renderComponent = (initialState = {}, routeParams = { formId: '123' }) => {
  const store = createMockStore(initialState);
  
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/view-form/${routeParams.formId}`]}>
        <Routes>
          <Route path="/view-form/:formId" element={<ViewFormPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('ViewFormPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    formService.getFormById.mockResolvedValue(mockFormData);
  });

  // Test 1: Initial render and loading state
  test('renders loading state initially', async () => {
    renderComponent({ formBuilder: { loading: true } });
    expect(screen.getByText('LoadingSpinner')).toBeInTheDocument();
    expect(screen.getByText('Loading form details...')).toBeInTheDocument();
  });

  // Test 2: Fetch form details on mount
  test('fetches form details on mount', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(formService.getFormById).toHaveBeenCalledWith('123');
    });
  });

  // Test 3: Handle form fetch error
  test('handles form fetch error', async () => {
    formService.getFormById.mockRejectedValue(new Error('Fetch failed'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load form details');
    });
  });

  // Test 4: Render configuration tab
  test('renders configuration tab by default', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      }
    });
    
    await waitFor(() => {
      expect(screen.getByText('FormConfig')).toBeInTheDocument();
    });
  });

  // Test 5: Switch to layout tab
  test('switches to layout tab', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      }
    });
    
    const layoutTab = screen.getByText('Form Layout');
    fireEvent.click(layoutTab);
    
    await waitFor(() => {
      expect(screen.getByText('SectionEditor')).toBeInTheDocument();
    });
  });

  // Test 6: Show empty state for layout with no questions
  test('shows empty state when no questions in layout tab', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: []
      }
    });
    
    const layoutTab = screen.getByText('Form Layout');
    fireEvent.click(layoutTab);
    
    await waitFor(() => {
      expect(screen.getByText('No questions available for this form.')).toBeInTheDocument();
    });
  });

  // Test 7: Switch to responses tab
  test('switches to responses tab', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: [],
        totalItems: 0
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      expect(screen.getByText('Response Summary')).toBeInTheDocument();
    });
  });

  // Test 8: Show empty responses state
  test('shows empty responses state', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: [],
        totalItems: 0
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      expect(screen.getByText('No responses yet')).toBeInTheDocument();
      expect(screen.getByText('Share your form to start collecting responses')).toBeInTheDocument();
    });
  });

  // Test 9: Display responses table
  test('displays responses table with data', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: mockResponses,
        totalItems: 2
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('user123')).toBeInTheDocument();
    });
  });

  // Test 10: Search functionality
  test('handles search input', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: mockResponses,
        totalItems: 2
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by Name/User ID');
      fireEvent.change(searchInput, { target: { value: 'John' } });
      fireEvent.keyPress(searchInput, { key: 'Enter', code: 13, charCode: 13 });
    });
  });

  // Test 11: Export to Excel
  test('handles export to Excel', async () => {
    responseService.exportToCSV.mockResolvedValue({});
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: mockResponses,
        totalItems: 2
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const exportBtn = screen.getByText('📊 Export to Excel');
      fireEvent.click(exportBtn);
    });
    
    await waitFor(() => {
      expect(responseService.exportToCSV).toHaveBeenCalledWith('123');
      expect(toast.success).toHaveBeenCalledWith('Responses exported successfully!');
    });
  });

  // Test 12: Export error handling
  test('handles export error', async () => {
    responseService.exportToCSV.mockRejectedValue(new Error('Export failed'));
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: mockResponses,
        totalItems: 2
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const exportBtn = screen.getByText('📊 Export to Excel');
      fireEvent.click(exportBtn);
    });
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to export responses');
    });
  });

  // Test 13: Sort functionality
  test('handles column sorting', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: mockResponses,
        totalItems: 2
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const submittedByHeader = screen.getByText(/Submitted By/);
      fireEvent.click(submittedByHeader);
      fireEvent.click(submittedByHeader); // Click again to change direction
    });
  });

  // Test 14: View individual response
  test('views individual response', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: mockResponses,
        totalItems: 2
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const viewBtns = screen.getAllByText('View');
      fireEvent.click(viewBtns[0]);
    });
  });

  // Test 15: Switch to individual response tab
  test('switches to individual response tab', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: mockResponses,
        totalItems: 2
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const individualTab = screen.getByText('Individual Response');
      fireEvent.click(individualTab);
    });
  });

  // Test 16: Back to summary from individual view
  test('goes back to summary from individual view', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: mockResponses,
        totalItems: 2
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const viewBtn = screen.getAllByText('View')[0];
      fireEvent.click(viewBtn);
    });
    
    await waitFor(() => {
      const backBtn = screen.getByText('← Back to summary');
      fireEvent.click(backBtn);
    });
  });

  // Test 17: Preview functionality
  test('toggles preview modal', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions,
        showPreview: true
      }
    });
    
    await waitFor(() => {
      expect(screen.getByText('Form Preview')).toBeInTheDocument();
      const closeBtn = screen.getByText('×');
      fireEvent.click(closeBtn);
    });
  });

  // Test 18: Handle save (disabled in view mode)
  test('handles save button click', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      }
    });
    
    const layoutTab = screen.getByText('Form Layout');
    fireEvent.click(layoutTab);
    
    await waitFor(() => {
      const saveBtn = screen.getByText('View Only');
      fireEvent.click(saveBtn);
      expect(toast.info).toHaveBeenCalledWith('Cannot edit in view mode');
    });
  });

  // Test 19: Pagination controls
  test('handles pagination controls', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: mockResponses,
        totalItems: 50
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const itemsSelect = screen.getByDisplayValue('10');
      fireEvent.change(itemsSelect, { target: { value: '25' } });
      
      const pageSelect = screen.getByDisplayValue('1');
      fireEvent.change(pageSelect, { target: { value: '2' } });
      
      const nextBtn = screen.getByText('❯');
      fireEvent.click(nextBtn);
      
      const prevBtn = screen.getByText('❮');
      fireEvent.click(prevBtn);
    });
  });

  // Test 20: Form with answers array instead of details
  test('renders response with answers array format', async () => {
    const responseWithAnswers = {
      ...mockResponses[1],
      details: undefined,
      answers: [
        { questionId: 'q1', answer: 'Test Answer' },
        { questionId: 'q2', value: 'Test Value' }
      ]
    };
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: [responseWithAnswers],
        totalItems: 1
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const viewBtn = screen.getByText('View');
      fireEvent.click(viewBtn);
    });
  });

  // Test 21: Handle checkbox with multiple selections
  test('handles checkbox with comma-separated values', async () => {
    const responseWithCheckbox = {
      id: 3,
      submittedBy: 'Test User',
      submittedAt: new Date().toISOString(),
      details: [
        { questionId: 'q5', answer: 'opt1, opt2' }
      ]
    };
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: [responseWithCheckbox],
        totalItems: 1
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const viewBtn = screen.getByText('View');
      fireEvent.click(viewBtn);
    });
  });

  // Test 22: Individual response list view
  test('shows individual response list when no response selected', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: mockResponses,
        totalItems: 2
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    const individualTab = screen.getByText('Individual Response');
    fireEvent.click(individualTab);
    
    await waitFor(() => {
      expect(screen.getByText('Select a response from the left to view details')).toBeInTheDocument();
    });
  });

  // Test 23: Click response entry in individual view
  test('selects response from individual list', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: mockResponses,
        totalItems: 2
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    const individualTab = screen.getByText('Individual Response');
    fireEvent.click(individualTab);
    
    await waitFor(() => {
      const responseEntry = screen.getByText('John Doe');
      fireEvent.click(responseEntry);
    });
  });

  // Test 24: Empty individual responses
  test('shows empty state in individual view', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: [],
        totalItems: 0
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    const individualTab = screen.getByText('Individual Response');
    fireEvent.click(individualTab);
    
    await waitFor(() => {
      expect(screen.getByText('No responses yet')).toBeInTheDocument();
      expect(screen.getByText('When users submit responses, they will appear here')).toBeInTheDocument();
    });
  });

  // Test 25: Route with activeTab state
  test('initializes with activeTab from location state', () => {
    const store = createMockStore({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: mockResponses,
        totalItems: 2
      }
    });
    
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[{
          pathname: '/view-form/123',
          state: { activeTab: 'responses' }
        }]}>
          <Routes>
            <Route path="/view-form/:formId" element={<ViewFormPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    expect(screen.getByText('Response Summary')).toBeInTheDocument();
  });

  // Test 26: Invalid activeTab in location state
  test('defaults to configuration for invalid activeTab', () => {
    const store = createMockStore({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      }
    });
    
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[{
          pathname: '/view-form/123',
          state: { activeTab: 'invalid' }
        }]}>
          <Routes>
            <Route path="/view-form/:formId" element={<ViewFormPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    expect(screen.getByText('FormConfig')).toBeInTheDocument();
  });

  // Test 27: Handle null/undefined values
  test('handles null and undefined response values', async () => {
    const responseWithNulls = {
      id: 4,
      submittedBy: null,
      userId: null,
      email: null,
      submittedAt: null,
      details: [
        { questionId: 'q1', answer: null }
      ]
    };
    
    renderComponent({
      formBuilder: {
        formData: { ...mockFormData, title: null },
        questions: mockFormData.questions
      },
      responses: {
        responses: [responseWithNulls],
        totalItems: 1
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      expect(screen.getByText('Anonymous')).toBeInTheDocument();
      expect(screen.getAllByText('-')).toHaveLength(3); // userId, email, date
    });
  });

  // Test 28: Preview button in layout tab
  test('opens preview from layout tab', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      }
    });
    
    const layoutTab = screen.getByText('Form Layout');
    fireEvent.click(layoutTab);
    
    await waitFor(() => {
      const previewBtn = screen.getByText(/Preview Form/);
      fireEvent.click(previewBtn);
    });
  });

  // Test 29: Preview button in responses tab
  test('opens preview from responses tab', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: mockResponses,
        totalItems: 2
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const previewBtn = screen.getByText('👁️ Preview Form');
      fireEvent.click(previewBtn);
    });
  });

  // Test 30: Empty questions array handling
  test('handles empty questions array from API', async () => {
    formService.getFormById.mockResolvedValue({
      ...mockFormData,
      questions: []
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(formService.getFormById).toHaveBeenCalledWith('123');
    });
  });

  // Test 31: Questions without proper IDs
  test('handles questions without proper IDs', async () => {
    formService.getFormById.mockResolvedValue({
      ...mockFormData,
      questions: [
        { text: 'Question without ID' },
        { questionId: 'q2', text: 'Question with questionId' },
        { _id: 'q3', text: 'Question with _id' }
      ]
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(formService.getFormById).toHaveBeenCalledWith('123');
    });
  });

  // Test 32: Next button in configuration tab
  test('handles next button in configuration tab', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      }
    });
    
    await waitFor(() => {
      const nextBtn = screen.getByText('Next');
      fireEvent.click(nextBtn);
    });
    
    await waitFor(() => {
      expect(screen.getByText('SectionEditor')).toBeInTheDocument();
    });
  });

  // Test 33: JSON parse error in checkbox answer
  test('handles JSON parse error in checkbox answer', async () => {
    const responseWithBadJson = {
      id: 5,
      submittedBy: 'Test User',
      submittedAt: new Date().toISOString(),
      details: [
        { questionId: 'q5', answer: '[invalid json' }
      ]
    };
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: [responseWithBadJson],
        totalItems: 1
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const viewBtn = screen.getByText('View');
      fireEvent.click(viewBtn);
    });
  });

  // Test 34: Disabled pagination buttons
  test('disables pagination buttons at boundaries', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: mockResponses,
        totalItems: 10
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const prevBtn = screen.getByText('❮');
      expect(prevBtn).toBeDisabled();
      
      const nextBtn = screen.getByText('❯');
      expect(nextBtn).toBeDisabled();
    });
  });

  // Test 35: Date picker question type
  test('handles date_picker question type', async () => {
    const dateResponse = {
      id: 6,
      submittedBy: 'Test User',
      submittedAt: new Date().toISOString(),
      details: [
        { questionId: 'q4', answer: '2024-01-15' }
      ]
    };
    
    const questionsWithDatePicker = [...mockFormData.questions];
    questionsWithDatePicker[3].type = 'date_picker';
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: questionsWithDatePicker
      },
      responses: {
        responses: [dateResponse],
        totalItems: 1
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const viewBtn = screen.getByText('View');
      fireEvent.click(viewBtn);
    });
  });

    // Test 36: Long answer and paragraph question types
  test('handles long_answer and paragraph question types', async () => {
    const questionsWithVariousTypes = [
      { id: 'q1', type: 'long_answer', text: 'Long Answer Question' },
      { id: 'q2', type: 'paragraph', text: 'Paragraph Question' }
    ];
    
    const responseWithLongAnswers = {
      id: 7,
      submittedBy: 'Test User',
      submittedAt: new Date().toISOString(),
      details: [
        { questionId: 'q1', answer: 'This is a long answer' },
        { questionId: 'q2', answer: 'This is a paragraph answer' }
      ]
    };
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: questionsWithVariousTypes
      },
      responses: {
        responses: [responseWithLongAnswers],
        totalItems: 1
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const viewBtn = screen.getByText('View');
      fireEvent.click(viewBtn);
    });
  });

  // Test 37: File type question
  test('handles file type question', async () => {
    const questionsWithFile = [
      { id: 'q1', type: 'file', text: 'File Question' }
    ];
    
    const responseWithFile = {
      id: 8,
      submittedBy: 'Test User',
      submittedAt: new Date().toISOString(),
      details: [
        { questionId: 'q1', answer: '[FILE_UPLOADED:test.pdf]' }
      ]
    };
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: questionsWithFile
      },
      responses: {
        responses: [responseWithFile],
        totalItems: 1
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const viewBtn = screen.getByText('View');
      fireEvent.click(viewBtn);
    });
  });

  // Test 38: Radio and dropdown question types
  test('handles radio and dropdown question types', async () => {
    const questionsWithOptions = [
      { 
        id: 'q1', 
        type: 'radio', 
        text: 'Radio Question',
        options: [{ id: 'opt1', value: 'Option 1' }]
      },
      { 
        id: 'q2', 
        type: 'dropdown', 
        text: 'Dropdown Question',
        options: [{ id: 'opt2', value: 'Option 2' }]
      }
    ];
    
    const responseWithOptions = {
      id: 9,
      submittedBy: 'Test User',
      submittedAt: new Date().toISOString(),
      details: [
        { questionId: 'q1', answer: 'opt1, opt2' },
        { questionId: 'q2', answer: 'opt2' }
      ]
    };
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: questionsWithOptions
      },
      responses: {
        responses: [responseWithOptions],
        totalItems: 1
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const viewBtn = screen.getByText('View');
      fireEvent.click(viewBtn);
    });
  });

  // Test 39: Empty file upload answer
  test('handles empty file upload answer', async () => {
    const responseWithNoFile = {
      id: 10,
      submittedBy: 'Test User',
      submittedAt: new Date().toISOString(),
      details: [
        { questionId: 'q3', answer: '' }
      ]
    };
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: [responseWithNoFile],
        totalItems: 1
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const viewBtn = screen.getByText('View');
      fireEvent.click(viewBtn);
    });
    
    await waitFor(() => {
      expect(screen.getByText('No file uploaded')).toBeInTheDocument();
    });
  });

  // Test 40: Empty date answer
  test('handles empty date answer', async () => {
    const responseWithNoDate = {
      id: 11,
      submittedBy: 'Test User',
      submittedAt: new Date().toISOString(),
      details: [
        { questionId: 'q4', answer: '' }
      ]
    };
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: [responseWithNoDate],
        totalItems: 1
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const viewBtn = screen.getByText('View');
      fireEvent.click(viewBtn);
    });
  });

  // Test 41: Response without details or answers
  test('handles response without details or answers', async () => {
    const emptyResponse = {
      id: 12,
      submittedBy: 'Test User',
      submittedAt: new Date().toISOString()
    };
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: [emptyResponse],
        totalItems: 1
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const viewBtn = screen.getByText('View');
      fireEvent.click(viewBtn);
    });
  });

  // Test 42: Questions with various property names
  test('handles questions with various property names', async () => {
    formService.getFormById.mockResolvedValue({
      ...mockFormData,
      questions: [
        { 
          questionId: 'q1', 
          questionText: 'Text from questionText',
          descriptionEnabled: true,
          description: 'Description',
          singleChoice: true,
          multipleChoice: false,
          maxLength: 100
        }
      ]
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(formService.getFormById).toHaveBeenCalled();
    });
  });

  // Test 43: Form without questions property
  test('handles form without questions property', async () => {
    formService.getFormById.mockResolvedValue({
      id: '123',
      title: 'Test Form',
      description: 'Test Description'
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(formService.getFormById).toHaveBeenCalled();
    });
  });

  // Test 44: Search without Enter key
  test('handles search input change without Enter', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: mockResponses,
        totalItems: 2
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search by Name/User ID');
      fireEvent.change(searchInput, { target: { value: 'Test' } });
      fireEvent.keyPress(searchInput, { key: 'A', code: 65, charCode: 65 });
    });
  });

  // Test 45: Options as string array
  test('handles options as string array', async () => {
    const questionsWithStringOptions = [
      {
        id: 'q1',
        type: 'checkbox',
        text: 'Question with string options',
        options: ['Option 1', 'Option 2']
      }
    ];
    
    const responseWithStringOptions = {
      id: 13,
      submittedBy: 'Test User',
      submittedAt: new Date().toISOString(),
      details: [
        { questionId: 'q1', answer: 'Option 1, Option 2' }
      ]
    };
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: questionsWithStringOptions
      },
      responses: {
        responses: [responseWithStringOptions],
        totalItems: 1
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const viewBtn = screen.getByText('View');
      fireEvent.click(viewBtn);
    });
  });

  // Test 46: Options with optionId property
  test('handles options with optionId property', async () => {
    const questionsWithOptionId = [
      {
        id: 'q1',
        type: 'checkbox',
        text: 'Question',
        options: [{ optionId: 'opt1', value: 'Option 1' }]
      }
    ];
    
    const responseWithOptionId = {
      id: 14,
      submittedBy: 'Test User',
      submittedAt: new Date().toISOString(),
      details: [
        { questionId: 'q1', answer: 'opt1' }
      ]
    };
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: questionsWithOptionId
      },
      responses: {
        responses: [responseWithOptionId],
        totalItems: 1
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const viewBtn = screen.getByText('View');
      fireEvent.click(viewBtn);
    });
  });

  // Test 47: Question without text property
  test('handles question without text property', async () => {
    const questionsWithoutText = [
      {
        id: 'q1',
        type: 'short_text',
        required: false
      }
    ];
    
    const responseForQuestionWithoutText = {
      id: 15,
      submittedBy: 'Test User',
      submittedAt: new Date().toISOString(),
      details: [
        { questionId: 'q1', answer: 'Answer' }
      ]
    };
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: questionsWithoutText
      },
      responses: {
        responses: [responseForQuestionWithoutText],
        totalItems: 1
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const viewBtn = screen.getByText('View');
      fireEvent.click(viewBtn);
    });
  });

  // Test 48: Response with no submittedAt date
  test('handles response with no submittedAt date', async () => {
    const responseWithoutDate = {
      id: 16,
      submittedBy: 'Test User',
      submittedAt: null,
      details: []
    };
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: [responseWithoutDate],
        totalItems: 1
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  // Test 49: Form with undefined status
  test('handles form with undefined status', async () => {
    formService.getFormById.mockResolvedValue({
      id: '123',
      title: 'Test Form',
      description: 'Test Description',
      isVisible: undefined,
      status: undefined,
      questions: []
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(formService.getFormById).toHaveBeenCalled();
    });
  });

  // Test 50: Response with no matching question
  test('handles response with no matching question', async () => {
    const responseWithUnmatchedQuestion = {
      id: 17,
      submittedBy: 'Test User',
      submittedAt: new Date().toISOString(),
      details: [
        { questionId: 'nonexistent', answer: 'Answer' }
      ]
    };
    
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: [responseWithUnmatchedQuestion],
        totalItems: 1
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      const viewBtn = screen.getByText('View');
      fireEvent.click(viewBtn);
    });
  });

  // Test 51: Form with no formId param
  test('does not fetch form when no formId', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/view-form/']}>
          <Routes>
            <Route path="/view-form/" element={<ViewFormPage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    expect(formService.getFormById).not.toHaveBeenCalled();
  });

  // Test 52: Cleanup on unmount
  test('cleans up on unmount', () => {
    const { unmount } = renderComponent();
    unmount();
  });

  // Test 53: Total items zero pagination
  test('handles zero total items in pagination', async () => {
    renderComponent({
      formBuilder: {
        formData: mockFormData,
        questions: mockFormData.questions
      },
      responses: {
        responses: [],
        totalItems: 0
      }
    });
    
    const responsesTab = screen.getByText('Responses');
    fireEvent.click(responsesTab);
    
    await waitFor(() => {
      expect(screen.getByText('No responses yet')).toBeInTheDocument();
    });
  });
});
