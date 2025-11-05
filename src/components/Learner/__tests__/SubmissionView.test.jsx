import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import responseService from '../../../services/responseService';
import toast from 'react-hot-toast';
import SubmissionView from '../SubmissionView';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/responseService');
jest.mock('react-hot-toast');
jest.mock('../../Common/LoadingSpinner', () => () => <div>Loading...</div>);
jest.mock('../../Common/NavigationBar', () => () => <nav>NavigationBar</nav>);

describe('SubmissionView', () => {
  const mockNavigate = jest.fn();
  const mockSubmission = {
    id: 'sub123',
    formId: 'form123',
    formTitle: 'Test Form',
    submittedAt: '2024-01-01T10:00:00Z',
    details: [
      { questionId: 'q1', answer: 'Answer 1' },
      { questionId: 'q2', answer: '2024-01-01' },
      { questionId: 'q3', answer: '[FILE_UPLOADED:test.pdf]' },
      { questionId: 'q4', answer: 'Option 1, Option 2' }
    ]
  };

  const mockFormDetails = {
    formId: 'form123',
    title: 'Test Form',
    questions: [
      { id: 'q1', text: 'Text Question', type: 'short_text', required: true },
      { id: 'q2', text: 'Date Question', type: 'date' },
      { id: 'q3', text: 'File Question', type: 'file_upload' },
      { id: 'q4', text: 'Multi Question', type: 'checkbox', multiple_choice: true },
      { id: 'q5', text: 'Long Question', type: 'long_text', description: 'Description' },
      { id: 'q6', text: 'Para Question', type: 'paragraph' }
    ]
  };

  const mockResponseDetails = {
    answers: [
      { questionId: 'q1', answer: 'Response Answer' }
    ],
    fileUploads: [
      { questionId: 'q3', fileName: 'uploaded.pdf', fileType: 'application/pdf', fileSize: 1024 }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ submissionId: 'sub123' });
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({ state: null });
    useAuth.mockReturnValue({
      user: { role: 'Learner' },
      isAuthenticated: true
    });
    global.URL.createObjectURL = jest.fn(() => 'blob:url');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('should redirect if not authenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false
    });

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should redirect if user is not Learner', () => {
    useAuth.mockReturnValue({
      user: { role: 'Admin' },
      isAuthenticated: true
    });

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should load submission from location state', async () => {
    useLocation.mockReturnValue({ state: { submission: mockSubmission } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(responseService.getFormById).toHaveBeenCalledWith('form123');
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });
  });

  it('should fetch response details if not in submission', async () => {
    const submissionWithoutDetails = { ...mockSubmission, details: [] };
    useLocation.mockReturnValue({ state: { submission: submissionWithoutDetails } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);
    responseService.getResponseDetails.mockResolvedValue(mockResponseDetails);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(responseService.getResponseDetails).toHaveBeenCalledWith('sub123');
    });
  });

  it('should use responseId if available', async () => {
    const submissionWithResponseId = { ...mockSubmission, responseId: 'resp456', details: [] };
    useLocation.mockReturnValue({ state: { submission: submissionWithResponseId } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(responseService.getResponseDetails).toHaveBeenCalledWith('resp456');
    });
  });

  it('should fetch submission from list if not in state', async () => {
    responseService.getMySubmissions.mockResolvedValue([mockSubmission]);
    responseService.getFormById.mockResolvedValue(mockFormDetails);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(responseService.getMySubmissions).toHaveBeenCalled();
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });
  });

  it('should handle submission not found', async () => {
    responseService.getMySubmissions.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load submission details');
      expect(mockNavigate).toHaveBeenCalledWith('/learner/dashboard', { state: { activeTab: 'submissions' } });
    });
  });

  it('should handle 403 error for response details', async () => {
    useLocation.mockReturnValue({ state: { submission: mockSubmission } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);
    responseService.getResponseDetails.mockRejectedValue({
      response: { status: 403 }
    });

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });
  });

  it('should handle other errors for response details', async () => {
    const submissionWithoutDetails = { ...mockSubmission, details: [] };
    useLocation.mockReturnValue({ state: { submission: submissionWithoutDetails } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);
    responseService.getResponseDetails.mockRejectedValue(new Error('Server error'));

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });
  });

  it('should format date correctly', async () => {
    useLocation.mockReturnValue({ state: { submission: mockSubmission } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Submitted on 01/01/2024')).toBeInTheDocument();
    });
  });

  it('should handle null date', async () => {
    const submissionNoDate = { ...mockSubmission, submittedAt: null };
    useLocation.mockReturnValue({ state: { submission: submissionNoDate } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Submitted on -')).toBeInTheDocument();
    });
  });

  it('should display file upload answers', async () => {
    useLocation.mockReturnValue({ state: { submission: mockSubmission } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('should download file', async () => {
    useLocation.mockReturnValue({ state: { submission: mockSubmission } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);
    responseService.downloadFile.mockResolvedValue(new Blob(['content']));

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);
    });

    await waitFor(() => {
      expect(responseService.downloadFile).toHaveBeenCalledWith('sub123', 'q3');
      expect(toast.success).toHaveBeenCalledWith('File downloaded successfully');
    });
  });

  it('should handle download error', async () => {
    useLocation.mockReturnValue({ state: { submission: mockSubmission } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);
    responseService.downloadFile.mockRejectedValue(new Error('Download failed'));

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to download file');
    });
  });

  it('should show submission not found when null', async () => {
    responseService.getMySubmissions.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Submission Not Found')).toBeInTheDocument();
    });
  });

  it('should handle multiple choice answers', async () => {
    useLocation.mockReturnValue({ state: { submission: mockSubmission } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    // ... continuing from previous part

    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });
  });

  it('should use responseDetails for answers when available', async () => {
    const submissionWithoutDetails = { ...mockSubmission, details: [] };
    useLocation.mockReturnValue({ state: { submission: submissionWithoutDetails } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);
    responseService.getResponseDetails.mockResolvedValue(mockResponseDetails);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Response Answer')).toBeInTheDocument();
    });
  });

  it('should handle file uploads from responseDetails', async () => {
    const submissionWithoutDetails = { ...mockSubmission, details: [] };
    useLocation.mockReturnValue({ state: { submission: submissionWithoutDetails } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);
    responseService.getResponseDetails.mockResolvedValue(mockResponseDetails);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('uploaded.pdf')).toBeInTheDocument();
      expect(screen.getByText('(1.00 KB)')).toBeInTheDocument();
    });
  });

  it('should handle missing answers', async () => {
    const submissionEmpty = { ...mockSubmission, details: [] };
    useLocation.mockReturnValue({ state: { submission: submissionEmpty } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText('-');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  it('should handle no file uploaded', async () => {
    const formWithFileNoUpload = {
      ...mockFormDetails,
      questions: [{ id: 'q1', text: 'File', type: 'file_upload' }]
    };
    const submissionNoFile = { ...mockSubmission, details: [] };
    
    useLocation.mockReturnValue({ state: { submission: submissionNoFile } });
    responseService.getFormById.mockResolvedValue(formWithFileNoUpload);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No file uploaded')).toBeInTheDocument();
    });
  });

  it('should render textarea for long text questions', async () => {
    useLocation.mockReturnValue({ state: { submission: mockSubmission } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      const textareas = document.querySelectorAll('textarea');
      expect(textareas.length).toBeGreaterThan(0);
    });
  });

  it('should handle answer with value property', async () => {
    const responseDetailsWithValue = {
      answers: [
        { questionId: 'q1', value: 'Value Answer' }
      ]
    };
    
    const submissionWithoutDetails = { ...mockSubmission, details: [] };
    useLocation.mockReturnValue({ state: { submission: submissionWithoutDetails } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);
    responseService.getResponseDetails.mockResolvedValue(responseDetailsWithValue);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Value Answer')).toBeInTheDocument();
    });
  });

  it('should handle file without size', async () => {
    const responseDetailsNoSize = {
      fileUploads: [
        { questionId: 'q3', fileName: 'file.pdf' }
      ]
    };
    
    const submissionWithoutDetails = { ...mockSubmission, details: [] };
    useLocation.mockReturnValue({ state: { submission: submissionWithoutDetails } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);
    responseService.getResponseDetails.mockResolvedValue(responseDetailsNoSize);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('file.pdf')).toBeInTheDocument();
      expect(screen.queryByText(/KB/)).not.toBeInTheDocument();
    });
  });

  it('should use responseId from params for download', async () => {
    const submissionWithResponseId = { ...mockSubmission, responseId: 'resp789' };
    useLocation.mockReturnValue({ state: { submission: submissionWithResponseId } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);
    responseService.downloadFile.mockResolvedValue(new Blob(['content']));

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);
    });

    await waitFor(() => {
      expect(responseService.downloadFile).toHaveBeenCalledWith('resp789', 'q3');
    });
  });

  it('should use submissionId from params for download', async () => {
    useParams.mockReturnValue({ submissionId: 'param123' });
    useLocation.mockReturnValue({ state: { submission: mockSubmission } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);
    responseService.downloadFile.mockResolvedValue(new Blob(['content']));

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);
    });

    await waitFor(() => {
      expect(responseService.downloadFile).toHaveBeenCalledWith('sub123', 'q3');
    });
  });

  it('should handle submission with responseId for fetching', async () => {
    responseService.getMySubmissions.mockResolvedValue([
      { id: 'sub456', responseId: 'param123', formId: 'form123' }
    ]);
    responseService.getFormById.mockResolvedValue(mockFormDetails);
    useParams.mockReturnValue({ submissionId: 'param123' });

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(responseService.getFormById).toHaveBeenCalledWith('form123');
    });
  });

  it('should handle error loading form details', async () => {
    useLocation.mockReturnValue({ state: { submission: mockSubmission } });
    responseService.getFormById.mockRejectedValue(new Error('Form load error'));

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Loading form details...')).toBeInTheDocument();
    });
  });

  it('should handle question without text', async () => {
    const formWithQuestionProps = {
      ...mockFormDetails,
      questions: [
        { id: 'q1', question: 'Alternative Question Text', type: 'short_text' }
      ]
    };
    
    useLocation.mockReturnValue({ state: { submission: mockSubmission } });
    responseService.getFormById.mockResolvedValue(formWithQuestionProps);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Alternative Question Text/)).toBeInTheDocument();
    });
  });

  it('should handle questions with _id', async () => {
    const formWithUnderscoredId = {
      ...mockFormDetails,
      questions: [
        { _id: 'q1', text: 'Question with _id', type: 'short_text' }
      ]
    };
    
    useLocation.mockReturnValue({ state: { submission: mockSubmission } });
    responseService.getFormById.mockResolvedValue(formWithUnderscoredId);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Question with _id/)).toBeInTheDocument();
    });
  });

  it('should show loading spinner initially', () => {
    responseService.getMySubmissions.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle long_answer type', async () => {
    const formWithLongAnswer = {
      ...mockFormDetails,
      questions: [{ id: 'q1', text: 'Long Answer', type: 'long_answer' }]
    };
    
    useLocation.mockReturnValue({ state: { submission: mockSubmission } });
    responseService.getFormById.mockResolvedValue(formWithLongAnswer);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      const textarea = document.querySelector('textarea');
      expect(textarea).toBeInTheDocument();
    });
  });

  it('should handle date_picker type', async () => {
    const formWithDatePicker = {
      ...mockFormDetails,
      questions: [{ id: 'q1', text: 'Date Picker', type: 'date_picker' }]
    };
    const submissionWithDate = {
      ...mockSubmission,
      details: [{ questionId: 'q1', answer: '2024-01-15' }]
    };
    
    useLocation.mockReturnValue({ state: { submission: submissionWithDate } });
    responseService.getFormById.mockResolvedValue(formWithDatePicker);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('01/15/2024')).toBeInTheDocument();
    });
  });

  it('should handle empty date answer', async () => {
    const formWithDate = {
      ...mockFormDetails,
      questions: [{ id: 'q1', text: 'Date', type: 'date' }]
    };
    const submissionEmptyDate = {
      ...mockSubmission,
      details: [{ questionId: 'q1', answer: '' }]
    };
    
    useLocation.mockReturnValue({ state: { submission: submissionEmptyDate } });
    responseService.getFormById.mockResolvedValue(formWithDate);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      const input = screen.getByDisplayValue('');
      expect(input).toBeInTheDocument();
    });
  });

  it('should handle file type lowercase', async () => {
    const formWithFileLower = {
      ...mockFormDetails,
      questions: [{ id: 'q1', text: 'File', type: 'file' }]
    };
    
    useLocation.mockReturnValue({ state: { submission: mockSubmission } });
    responseService.getFormById.mockResolvedValue(formWithFileLower);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('File')).toBeInTheDocument();
    });
  });

  it('should handle downloading state', async () => {
    useLocation.mockReturnValue({ state: { submission: mockSubmission } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);
    responseService.downloadFile.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(new Blob(['content'])), 100))
    );

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);
    });

    expect(screen.getByText('Downloading...')).toBeInTheDocument();
  });

  it('should create and remove download link', async () => {
    const createElementSpy = jest.spyOn(document, 'createElement');
    const appendChildSpy = jest.spyOn(document.body, 'appendChild');
    const removeChildSpy = jest.spyOn(document.body, 'removeChild');

    useLocation.mockReturnValue({ state: { submission: mockSubmission } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);
    responseService.downloadFile.mockResolvedValue(new Blob(['content'], { type: 'application/pdf' }));

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);
    });

    await waitFor(() => {
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
    });
  });

  it('should not show responseId when null', async () => {
    const submissionNoResponseId = {
      ...mockSubmission,
      responseId: null
    };
    
    useLocation.mockReturnValue({ state: { submission: submissionNoResponseId } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });
  });

  it('should handle non-string answers', async () => {
    const submissionWithNonString = {
      ...mockSubmission,
      details: [{ questionId: 'q1', answer: null }]
    };
    
    useLocation.mockReturnValue({ state: { submission: submissionWithNonString } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('-')).toHaveLength(mockFormDetails.questions.length);
    });
  });

  it('should handle checkbox without comma separation', async () => {
    const submissionSingleCheckbox = {
      ...mockSubmission,
      details: [{ questionId: 'q4', answer: 'Single Option' }]
    };
    
    useLocation.mockReturnValue({ state: { submission: submissionSingleCheckbox } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Single Option')).toBeInTheDocument();
    });
  });

  it('should handle file response without extension check', async () => {
    const submissionFileNoExt = {
      ...mockSubmission,
      details: [{ questionId: 'q3', answer: '[FILE_UPLOADED:file]' }]
    };
    
    useLocation.mockReturnValue({ state: { submission: submissionFileNoExt } });
    responseService.getFormById.mockResolvedValue(mockFormDetails);

    render(
      <BrowserRouter>
        <SubmissionView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('file')).toBeInTheDocument();
    });
  });
});
