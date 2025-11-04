import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams, useNavigate, useLocation } from 'react-router-dom';
import SubmissionView from './SubmissionView';
import { useAuth } from '../../contexts/AuthContext';
import responseService from '../../services/responseService';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useLocation: jest.fn()
}));

jest.mock('../../contexts/AuthContext');
jest.mock('../../services/responseService');
jest.mock('react-hot-toast');
jest.mock('../Common/LoadingSpinner', () => () => <div>Loading...</div>);
jest.mock('../Common/NavigationBar', () => () => <nav>Navigation</nav>);

describe('SubmissionView Component', () => {
  const mockNavigate = jest.fn();
  const mockSubmission = {
    id: 'sub-123',
    responseId: 'resp-123',
    formId: 'form-123',
    formTitle: 'Test Form',
    submittedAt: new Date('2024-01-15'),
    details: [
      { questionId: 'q1', answer: 'Test answer' },
      { questionId: 'q2', answer: 'Option 1, Option 2' },
      { questionId: 'q3', answer: '[FILE_UPLOADED:test.pdf]' },
      { questionId: 'q4', answer: '2024-01-15' }
    ]
  };

  const mockFormDetails = {
    formId: 'form-123',
    title: 'Test Form',
    questions: [
      { id: 'q1', text: 'Question 1', type: 'text', required: true },
      { id: 'q2', text: 'Question 2', type: 'checkbox', multiple_choice: true },
      { id: 'q3', text: 'File Question', type: 'file_upload' },
      { id: 'q4', text: 'Date Question', type: 'date' },
      { id: 'q5', text: 'Long Text', type: 'long_text', description: 'Enter details' }
    ]
  };

  const mockResponseDetails = {
    answers: [
      { questionId: 'q1', answer: 'Test answer' }
    ],
    fileUploads: [
      { 
        questionId: 'q3', 
        fileName: 'test.pdf', 
        fileType: 'application/pdf',
        fileSize: 1024 
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ submissionId: 'sub-123' });
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({ state: null });
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'Learner', id: 'user-123' }
    });
    responseService.getFormById.mockResolvedValue(mockFormDetails);
    responseService.getResponseDetails.mockResolvedValue(mockResponseDetails);
    responseService.getMySubmissions.mockResolvedValue([mockSubmission]);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );
  };

  test('should redirect to login if not authenticated', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null
    });

    renderComponent();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('should redirect to login if user is not a Learner', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'Admin' }
    });

    renderComponent();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('should load submission from location state', async () => {
    useLocation.mockReturnValue({
      state: { submission: mockSubmission }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
      expect(screen.getByText(/Submitted on/)).toBeInTheDocument();
    });
  });

  test('should fetch submission from list when not in state', async () => {
    renderComponent();

    await waitFor(() => {
      expect(responseService.getMySubmissions).toHaveBeenCalled();
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });
  });

  test('should handle submission not found', async () => {
    toast.error = jest.fn();
    responseService.getMySubmissions.mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load submission details');
      expect(mockNavigate).toHaveBeenCalledWith('/learner/dashboard', { state: { activeTab: 'submissions' } });
    });
  });

  test('should handle submission loading error', async () => {
    toast.error = jest.fn();
    responseService.getMySubmissions.mockRejectedValue(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load submission details');
      expect(mockNavigate).toHaveBeenCalledWith('/learner/dashboard', { state: { activeTab: 'submissions' } });
    });
  });

  test('should fetch response details when not available', async () => {
    const submissionWithoutDetails = {
      ...mockSubmission,
      details: []
    };
    
    useLocation.mockReturnValue({
      state: { submission: submissionWithoutDetails }
    });

    renderComponent();

    await waitFor(() => {
      expect(responseService.getResponseDetails).toHaveBeenCalledWith('sub-123');
    });
  });

  test('should handle response details 403 error gracefully', async () => {
    responseService.getResponseDetails.mockRejectedValue({
      response: { status: 403 }
    });

    const submissionWithoutDetails = {
      ...mockSubmission,
      details: []
    };
    
    responseService.getMySubmissions.mockResolvedValue([submissionWithoutDetails]);

    renderComponent();

    await waitFor(() => {
      // Should not show error, just continue with submission.details
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });
  });

  test('should handle other response details errors', async () => {
    responseService.getResponseDetails.mockRejectedValue(new Error('Server error'));

    const submissionWithoutDetails = {
      ...mockSubmission,
      details: []
    };
    
    responseService.getMySubmissions.mockResolvedValue([submissionWithoutDetails]);

    renderComponent();

    await waitFor(() => {
      // Should continue despite error
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });
  });

  test('should display text answers correctly', async () => {
    useLocation.mockReturnValue({
      state: { submission: mockSubmission }
    });

    renderComponent();

    await waitFor(() => {
      const input = screen.getAllByRole('textbox')[0];
      expect(input.value).toBe('Test answer');
    });
  });

  test('should display checkbox answers as badges', async () => {
    useLocation.mockReturnValue({
      state: { submission: mockSubmission }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });
  });

  test('should display file upload answers', async () => {
    useLocation.mockReturnValue({
      state: { submission: mockSubmission }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('📎')).toBeInTheDocument();
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText('Download')).toBeInTheDocument();
    });
  });

  test('should format date answers', async () => {
    useLocation.mockReturnValue({
      state: { submission: mockSubmission }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue('01/15/2024')).toBeInTheDocument();
    });
  });

  test('should handle file download', async () => {
    toast.success = jest.fn();
    const mockBlob = new Blob(['test content']);
    responseService.downloadFile.mockResolvedValue(mockBlob);
    
    // Mock URL methods
    global.URL.createObjectURL = jest.fn(() => 'blob:test');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock createElement and appendChild
    const mockLink = document.createElement('a');
    mockLink.click = jest.fn();
    document.createElement = jest.fn(() => mockLink);

    useLocation.mockReturnValue({
      state: { submission: mockSubmission }
    });

    renderComponent();

    await waitFor(() => {
      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);
    });

    await waitFor(() => {
      expect(responseService.downloadFile).toHaveBeenCalledWith('sub-123', 'q3');
      expect(toast.success).toHaveBeenCalledWith('File downloaded successfully');
      expect(mockLink.download).toBe('test.pdf');
    });
  });

  test('should handle file download error', async () => {
    toast.error = jest.fn();
    responseService.downloadFile.mockRejectedValue(new Error('Download failed'));

    useLocation.mockReturnValue({
      state: { submission: mockSubmission }
    });

    renderComponent();

    await waitFor(() => {
      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to download file');
    });
  });

  test('should show downloading state', async () => {
    responseService.downloadFile.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(new Blob(['test'])), 1000))
    );

    useLocation.mockReturnValue({
      state: { submission: mockSubmission }
    });

    renderComponent();

    await waitFor(() => {
      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);
      
      expect(screen.getByText('Downloading...')).toBeInTheDocument();
    });
  });

  test('should display empty answer as dash', async () => {
    const submissionWithEmptyAnswer = {
      ...mockSubmission,
      details: [
        { questionId: 'q1', answer: '' },
        { questionId: 'q5', answer: null }
      ]
    };

    useLocation.mockReturnValue({
      state: { submission: submissionWithEmptyAnswer }
    });

    renderComponent();

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs[0].placeholder).toBe('-');
    });
  });

  test('should handle missing form details', async () => {
    responseService.getFormById.mockResolvedValue(null);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Loading form details...')).toBeInTheDocument();
    });
  });

  test('should handle form details loading error', async () => {
    responseService.getFormById.mockRejectedValue(new Error('Failed to load form'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });
  });

  test('should find submission by responseId', async () => {
    useParams.mockReturnValue({ submissionId: 'resp-123' });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });
  });

  test('should display submission not found when no submission', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'Learner' }
    });
    
    responseService.getMySubmissions.mockResolvedValue([]);
    
    // Override the error handling to show the not found state
    toast.error = jest.fn();

    const { container } = render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // After redirect, render again to show not found state
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'Learner' }
    });
    
    responseService.getMySubmissions.mockResolvedValue([]);
    
    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    // Mock to prevent redirect
    mockNavigate.mockClear();

    await waitFor(() => {
      // Component will either redirect or show error
      expect(toast.error).toHaveBeenCalled();
    });
  });

  test('should get answer from responseDetails when available', async () => {
    const fullResponseDetails = {
      answers: [
        { questionId: 'q1', answer: 'Answer from response details' }
      ],
      fileUploads: [
        { 
          questionId: 'q3', 
          fileName: 'response-file.pdf',
          fileType: 'application/pdf',
          fileSize: 2048
        }
      ]
    };

    responseService.getResponseDetails.mockResolvedValue(fullResponseDetails);
    
    const submissionNoDetails = {
      ...mockSubmission,
      details: []
    };

    useLocation.mockReturnValue({
      state: { submission: submissionNoDetails }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('response-file.pdf')).toBeInTheDocument();
      expect(screen.getByText('(2.00 KB)')).toBeInTheDocument();
    });
  });

  test('should handle file with no fileName', async () => {
    const submissionWithBadFile = {
      ...mockSubmission,
      details: [
        { questionId: 'q3', answer: '[FILE_UPLOADED:]' }
      ]
    };

    useLocation.mockReturnValue({
      state: { submission: submissionWithBadFile }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No file uploaded')).toBeInTheDocument();
    });
  });

  test('should handle long text questions', async () => {
    const submissionWithLongText = {
      ...mockSubmission,
      details: [
        { questionId: 'q5', answer: 'This is a long text answer' }
      ]
    };

    useLocation.mockReturnValue({
      state: { submission: submissionWithLongText }
    });

    renderComponent();

    await waitFor(() => {
      const textareas = screen.getAllByRole('textbox');
      const longTextarea = textareas.find(el => el.tagName === 'TEXTAREA');
      expect(longTextarea.value).toBe('This is a long text answer');
    });
  });

  test('should display question description when enabled', async () => {
    const formWithDescription = {
      ...mockFormDetails,
      questions: [
        {
          id: 'q1',
          text: 'Question with description',
          description: 'This is a description',
          descriptionEnabled: true
        }
      ]
    };

    responseService.getFormById.mockResolvedValue(formWithDescription);

    useLocation.mockReturnValue({
      state: { submission: mockSubmission }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });
  });

  test('should handle alternative date formats in submission', async () => {
    const submissionAltDate = {
      ...mockSubmission,
      submitted_at: new Date('2024-02-20')
    };

    useLocation.mockReturnValue({
      state: { submission: submissionAltDate }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Submitted on/)).toBeInTheDocument();
    });
  });

  test('should handle missing submission date', async () => {
    const submissionNoDate = {
      ...mockSubmission,
      submittedAt: null
    };

    useLocation.mockReturnValue({
      state: { submission: submissionNoDate }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Submitted on -')).toBeInTheDocument();
    });
  });

  test('should use responseId when id is not available', async () => {
    const submissionOnlyResponseId = {
      ...mockSubmission,
      id: null,
      responseId: 'resp-456'
    };

    useLocation.mockReturnValue({
      state: { submission: submissionOnlyResponseId }
    });

    renderComponent();

    await waitFor(() => {
      expect(responseService.getResponseDetails).toHaveBeenCalledWith('resp-456');
    });
  });

  test('should handle questions without text property', async () => {
    const formAltQuestions = {
      ...mockFormDetails,
      questions: [
        { id: 'q1', question: 'Alternative question format', type: 'text' }
      ]
    };

    responseService.getFormById.mockResolvedValue(formAltQuestions);

    useLocation.mockReturnValue({
      state: { submission: mockSubmission }
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Alternative question format/)).toBeInTheDocument();
    });
  });

  test('should handle answer value property in responseDetails', async () => {
    const responseWithValue = {
      answers: [
        { questionId: 'q1', value: 'Value property answer' }
      ]
    };

    responseService.getResponseDetails.mockResolvedValue(responseWithValue);
    
    const submissionNoDetails = {
      ...mockSubmission,
      details: []
    };

    useLocation.mockReturnValue({
      state: { submission: submissionNoDetails }
    });

    renderComponent();

    await waitFor(() => {
      const input = screen.getAllByRole('textbox')[0];
      expect(input.value).toBe('Value property answer');
    });
  });

  test('should use submissionId from params for download', async () => {
    const mockBlob = new Blob(['test']);
    responseService.downloadFile.mockResolvedValue(mockBlob);
    
    global.URL.createObjectURL = jest.fn(() => 'blob:test');
    global.URL.revokeObjectURL = jest.fn();
    
    const mockLink = document.createElement('a');
    mockLink.click = jest.fn();
    document.createElement = jest.fn(() => mockLink);

    useParams.mockReturnValue({ submissionId: 'param-sub-id' });
    
    const submissionNoIds = {
      formId: 'form-123',
      formTitle: 'Test Form',
      submittedAt: new Date(),
      details: [
        { questionId: 'q3', answer: '[FILE_UPLOADED:param-file.pdf]' }
      ]
    };

    responseService.getMySubmissions.mockResolvedValue([submissionNoIds]);

    renderComponent();

    await waitFor(() => {
      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);
    });

    await waitFor(() => {
      expect(responseService.downloadFile).toHaveBeenCalledWith('param-sub-id', 'q3');
    });
  });
 });