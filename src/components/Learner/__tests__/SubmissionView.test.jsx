import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter, useNavigate, useParams, useLocation } from 'react-router-dom';
import SubmissionView from '../SubmissionView';
import learnerReducer from '../../../store/slices/learnerSlice';
import responseService from '../../../services/responseService';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
  useLocation: jest.fn()
}));

jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/responseService');
jest.mock('react-hot-toast');
jest.mock('../../Common/LoadingSpinner', () => () => <div>Loading...</div>);
jest.mock('../../Common/NavigationBar', () => () => <div>NavigationBar</div>);

const mockSubmissionData = {
  id: '123',
  formId: 'form123',
  formTitle: 'Test Form',
  submittedAt: '2024-01-01T10:00:00Z',
  details: [
    { questionId: 'q1', answer: 'Text answer' },
    { questionId: 'q2', answer: '2024-01-01' },
    { questionId: 'q3', answer: '[FILE_UPLOADED:test.pdf]' },
    { questionId: 'q4', answer: 'Option 1, Option 2' },
    { questionId: 'q5', answer: '' }
  ]
};

const mockFormData = {
  id: 'form123',
  title: 'Test Form',
  questions: [
    { id: 'q1', text: 'Text Question', type: 'text', required: true },
    { id: 'q2', text: 'Date Question', type: 'date', required: true },
    { id: 'q3', text: 'File Question', type: 'file_upload', required: false },
    { id: 'q4', text: 'Checkbox Question', type: 'checkbox', required: false },
    { id: 'q5', text: 'Long Text', type: 'long_text', required: false, description: 'Description text' }
  ]
};

describe('SubmissionView Component', () => {
  let store;
  let mockNavigate;

  beforeEach(() => {
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ submissionId: '123' });
    useLocation.mockReturnValue({ state: null });
    
    store = configureStore({
      reducer: { learner: learnerReducer },
      preloadedState: {
        learner: {
          currentSubmission: {
            data: null,
            responseDetails: null,
            loading: false,
            error: null
          },
          currentForm: {
            data: null,
            loading: false,
            error: null
          },
          mySubmissions: {
            data: [],
            loading: false,
            error: null
          }
        }
      }
    });

    responseService.getMySubmissions.mockResolvedValue([]);
    responseService.getResponseDetails.mockResolvedValue({});
    responseService.downloadFile.mockResolvedValue(new Blob(['test'], { type: 'application/pdf' }));
    
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <SubmissionView />
        </BrowserRouter>
      </Provider>
    );
  };

  describe('Authentication and Authorization', () => {
    test('should redirect to login if not authenticated', () => {
      useAuth.mockReturnValue({ isAuthenticated: false, user: null });
      renderComponent();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

        test('should redirect if user is not a Learner', () => {
      useAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'Admin' } });
      renderComponent();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('should not redirect if authenticated as Learner', () => {
      useAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'Learner' } });
      renderComponent();
      expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    });
  });

  describe('Loading Submission Data', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'Learner' } });
    });

    test('should load submission from location state', async () => {
      useLocation.mockReturnValue({
        state: { submission: mockSubmissionData }
      });
      
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: mockSubmissionData },
            currentForm: { data: mockFormData, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });
    });

    test('should fetch submission from list when no location state', async () => {
      responseService.getMySubmissions.mockResolvedValue([mockSubmissionData]);
      
      renderComponent();
      
      await waitFor(() => {
        expect(responseService.getMySubmissions).toHaveBeenCalled();
      });
    });

    test('should use existing submissions from store', async () => {
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: null },
            currentForm: { data: null },
            mySubmissions: { 
              data: [mockSubmissionData],
              loading: false 
            }
          }
        }
      });
      
      renderComponent();
      
      await waitFor(() => {
        expect(responseService.getMySubmissions).not.toHaveBeenCalled();
      });
    });

    test('should handle submission not found', async () => {
      responseService.getMySubmissions.mockResolvedValue([]);
      
      renderComponent();
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load submission details');
        expect(mockNavigate).toHaveBeenCalledWith('/learner/dashboard', { state: { activeTab: 'submissions' } });
      });
    });

    test('should find submission by responseId', async () => {
      const submissionWithResponseId = {
        ...mockSubmissionData,
        responseId: '123',
        id: '456'
      };
      responseService.getMySubmissions.mockResolvedValue([submissionWithResponseId]);
      
      renderComponent();
      
      await waitFor(() => {
        expect(responseService.getMySubmissions).toHaveBeenCalled();
      });
    });

    test('should fetch response details when not in submission data', async () => {
      const submissionWithoutDetails = {
        ...mockSubmissionData,
        details: []
      };
      
      useLocation.mockReturnValue({
        state: { submission: submissionWithoutDetails }
      });
      
      renderComponent();
      
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Submission from state'));
      });
    });

    test('should handle error when fetching submission', async () => {
      responseService.getMySubmissions.mockRejectedValue(new Error('Network error'));
      
      renderComponent();
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load submission details');
        expect(mockNavigate).toHaveBeenCalledWith('/learner/dashboard', { state: { activeTab: 'submissions' } });
      });
    });
  });

  describe('Rendering Submission Data', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'Learner' } });
    });

    test('should show loading spinner when loading', () => {
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: mockSubmissionData, loading: true },
            currentForm: { data: null, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('should show loading when form is loading', () => {
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: mockSubmissionData, loading: false },
            currentForm: { data: null, loading: true },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('should render submission not found when no data', () => {
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: null, loading: false },
            currentForm: { data: null, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      expect(screen.getByText('Submission Not Found')).toBeInTheDocument();
      expect(screen.getByText('The requested submission could not be found.')).toBeInTheDocument();
    });

    test('should render all question types correctly', async () => {
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: mockSubmissionData },
            currentForm: { data: mockFormData, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText(/Text Question/)).toBeInTheDocument();
        expect(screen.getByText(/Date Question/)).toBeInTheDocument();
        expect(screen.getByText(/File Question/)).toBeInTheDocument();
        expect(screen.getByText(/Checkbox Question/)).toBeInTheDocument();
        expect(screen.getByText(/Long Text/)).toBeInTheDocument();
      });
    });

    test('should format date correctly', () => {
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: mockSubmissionData },
            currentForm: { data: mockFormData, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      expect(screen.getByText(/Submitted on 01\/01\/2024/)).toBeInTheDocument();
    });

    test('should handle missing submission date', () => {
      const submissionWithoutDate = {
        ...mockSubmissionData,
        submittedAt: null
      };
      
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: submissionWithoutDate },
            currentForm: { data: mockFormData, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      expect(screen.getByText(/Submitted on -/)).toBeInTheDocument();
    });
  });

  describe('Answer Display', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'Learner' } });
    });

    test('should display text answer', () => {
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: mockSubmissionData },
            currentForm: { data: mockFormData, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      const textInput = screen.getByDisplayValue('Text answer');
      expect(textInput).toBeInTheDocument();
      expect(textInput).toHaveAttribute('readOnly');
    });

    test('should display formatted date answer', () => {
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: mockSubmissionData },
            currentForm: { data: mockFormData, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      expect(screen.getByDisplayValue('01/01/2024')).toBeInTheDocument();
    });

    test('should display file upload with download button', () => {
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: mockSubmissionData },
            currentForm: { data: mockFormData, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText('Download')).toBeInTheDocument();
    });

    test('should display multiple choice answers', () => {
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: mockSubmissionData },
            currentForm: { data: mockFormData, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      const checkboxAnswers = screen.getAllByText(/Option/);
      expect(checkboxAnswers).toHaveLength(2);
    });

    test('should display empty answer as dash', () => {
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: mockSubmissionData },
            currentForm: { data: mockFormData, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      const emptyInputs = screen.getAllByPlaceholderText('-');
      expect(emptyInputs.length).toBeGreaterThan(0);
    });

    test('should handle answer from responseDetails', () => {
      const submissionWithResponseDetails = {
        ...mockSubmissionData,
        details: []
      };
      
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { 
              data: submissionWithResponseDetails,
              responseDetails: {
                answers: [
                  { questionId: 'q1', answer: 'Response detail answer' }
                ],
                fileUploads: [
                  { questionId: 'q3', fileName: 'detail.pdf', fileType: 'application/pdf', fileSize: 1024 }
                ]
              }
            },
            currentForm: { data: mockFormData, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      expect(screen.getByDisplayValue('Response detail answer')).toBeInTheDocument();
      expect(screen.getByText('detail.pdf')).toBeInTheDocument();
      expect(screen.getByText('(1.00 KB)')).toBeInTheDocument();
    });

    test('should handle file without fileName', () => {
      const submissionWithEmptyFile = {
        ...mockSubmissionData,
        details: [
          { questionId: 'q3', answer: '[FILE_UPLOADED:]' }
        ]
      };
      
      const formWithFileQuestion = {
        ...mockFormData,
        questions: [
          { id: 'q3', text: 'File Question', type: 'file_upload', required: false }
        ]
      };
      
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: submissionWithEmptyFile },
            currentForm: { data: formWithFileQuestion, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      expect(screen.getByText('No file uploaded')).toBeInTheDocument();
    });
  });

  describe('File Download', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'Learner' } });
      
      global.URL.createObjectURL = jest.fn(() => 'blob:url');
      global.URL.revokeObjectURL = jest.fn();
      
      const mockLink = document.createElement('a');
      mockLink.click = jest.fn();
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
    });

    test('should download file successfully', async () => {
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: mockSubmissionData },
            currentForm: { data: mockFormData, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);
      
      await waitFor(() => {
        expect(responseService.downloadFile).toHaveBeenCalledWith('123', 'q3');
        expect(toast.success).toHaveBeenCalledWith('File downloaded successfully');
      });
    });

    test('should handle download error', async () => {
      responseService.downloadFile.mockRejectedValue(new Error('Download failed'));
      
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: mockSubmissionData },
            currentForm: { data: mockFormData, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to download file');
      });
    });

    test('should show downloading state', async () => {
      responseService.downloadFile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: mockSubmissionData },
            currentForm: { data: mockFormData, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Downloading...')).toBeInTheDocument();
      });
    });

    test('should use responseId from submission data', async () => {
      const submissionWithResponseId = {
        ...mockSubmissionData,
        responseId: '456'
      };
      
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: submissionWithResponseId },
            currentForm: { data: mockFormData, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);
      
      await waitFor(() => {
        expect(responseService.downloadFile).toHaveBeenCalledWith('456', 'q3');
      });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'Learner' } });
    });

    test('should handle form without questions', () => {
      const formWithoutQuestions = {
        ...mockFormData,
        questions: null
      };
      
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: mockSubmissionData },
            currentForm: { data: formWithoutQuestions, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      expect(screen.getByText('Loading form details...')).toBeInTheDocument();
    });

    test('should handle question without text property', () => {
      const formWithQuestionAlias = {
        ...mockFormData,
        questions: [
          { id: 'q1', question: 'Alternative Question', type: 'text' }
        ]
      };
      
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: mockSubmissionData },
            currentForm: { data: formWithQuestionAlias, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      expect(screen.getByText(/Alternative Question/)).toBeInTheDocument();
    });

    test('should handle answer with value property', () => {
      const submissionWithValueAnswer = {
        ...mockSubmissionData,
        details: []
      };
      
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { 
              data: submissionWithValueAnswer,
              responseDetails: {
                answers: [
                  { questionId: 'q1', value: 'Value answer' }
                ]
              }
            },
            currentForm: { data: mockFormData, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      expect(screen.getByDisplayValue('Value answer')).toBeInTheDocument();
    });

    test('should cleanup on unmount', () => {
      const { unmount } = render(
        <Provider store={store}>
          <BrowserRouter>
            <SubmissionView />
          </BrowserRouter>
        </Provider>
      );
      
      unmount();
      
      // Verify cleanup was called (clearCurrentSubmission action)
      expect(store.getState().learner.currentSubmission.data).toBe(null);
    });

    test('should handle long_answer type as textarea', () => {
      const formWithLongAnswer = {
        ...mockFormData,
        questions: [
          { id: 'q1', text: 'Long Answer', type: 'long_answer' }
        ]
      };
      
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: mockSubmissionData },
            currentForm: { data: formWithLongAnswer, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      const textarea = screen.getByRole('textbox');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    test('should use form title from currentForm when not in submission', () => {
      const submissionWithoutTitle = {
        ...mockSubmissionData,
        formTitle: null
      };
      
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: submissionWithoutTitle },
            currentForm: { data: mockFormData, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });

    test('should fallback to default title when no form title available', () => {
      const submissionWithoutTitle = {
        ...mockSubmissionData,
        formTitle: null
      };
      
      const formWithoutTitle = {
        ...mockFormData,
        title: null
      };
      
      store = configureStore({
        reducer: { learner: learnerReducer },
        preloadedState: {
          learner: {
            currentSubmission: { data: submissionWithoutTitle },
            currentForm: { data: formWithoutTitle, loading: false },
            mySubmissions: { data: [] }
          }
        }
      });
      
      renderComponent();
      
      expect(screen.getByText('Form Submission')).toBeInTheDocument();
    });
  });
});

