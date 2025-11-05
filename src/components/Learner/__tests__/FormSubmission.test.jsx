import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import responseService from '../../../services/responseService';
import toast from 'react-hot-toast';
import FormSubmission from '../FormSubmission';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/responseService');
jest.mock('react-hot-toast');
jest.mock('../../Common/LoadingSpinner', () => () => <div>Loading...</div>);
jest.mock('../../Common/NavigationBar', () => () => <nav>NavigationBar</nav>);
jest.mock('../../Common/Modal', () => ({ isOpen, onClose, onConfirm, message }) => 
  isOpen ? (
    <div data-testid="modal">
      <p>{message}</p>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null
);

describe('FormSubmission', () => {
  const mockNavigate = jest.fn();
  const mockForm = {
    formId: 'form123',
    title: 'Test Form',
    description: 'Test Description',
    questions: [
      {
        id: 'q1',
        text: 'Short text question',
        type: 'short_text',
        required: true,
        placeholder: 'Enter text'
      },
      {
        id: 'q2',
        text: 'Long text question',
        type: 'long_text',
        required: false,
        description: 'Question description',
        descriptionEnabled: true
      },
      {
        id: 'q3',
        text: 'Choice question',
        type: 'choice',
        multipleChoice: true,
        options: ['Option 1', 'Option 2'],
        required: true
      },
      {
        id: 'q4',
        text: 'Single choice question',
        type: 'choice',
        multipleChoice: false,
        options: [{ value: 'Opt A' }, { value: 'Opt B' }],
        required: false
      },
      {
        id: 'q5',
        text: 'Date question',
        type: 'date',
        required: false
      },
      {
        id: 'q6',
        text: 'Number question',
        type: 'number',
        min: 1,
        max: 10,
        required: false
      },
      {
        id: 'q7',
        text: 'File upload question',
        type: 'file_upload',
        required: true
      },
      {
        id: 'q8',
        text: 'Checkbox question',
        type: 'checkbox',
        options: ['Check 1', 'Check 2'],
        required: false
      },
      {
        id: 'q9',
        text: 'Radio question',
        type: 'radio',
        options: ['Radio 1', 'Radio 2'],
        required: false
      },
      {
        id: 'q10',
        text: 'Default question',
        type: 'unknown',
        readOnly: true,
        required: false
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ formId: 'form123' });
    useNavigate.mockReturnValue(mockNavigate);
    useAuth.mockReturnValue({
      user: { role: 'Learner' },
      isAuthenticated: true
    });
  });

  it('should redirect to login if not authenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false
    });

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should redirect to login if user is not a Learner', () => {
    useAuth.mockReturnValue({
      user: { role: 'Admin' },
      isAuthenticated: true
    });

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should fetch form details on mount', async () => {
    responseService.getFormById.mockResolvedValue(mockForm);

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(responseService.getFormById).toHaveBeenCalledWith('form123');
    });
  });

  it('should handle form fetch error', async () => {
    responseService.getFormById.mockRejectedValue(new Error('Fetch failed'));

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load form');
      expect(mockNavigate).toHaveBeenCalledWith('/learner/dashboard');
    });
  });

  it('should initialize responses with empty values', async () => {
    responseService.getFormById.mockResolvedValue(mockForm);

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
    });
  });

  it('should handle input changes for text fields', async () => {
    responseService.getFormById.mockResolvedValue(mockForm);

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const input = screen.getByPlaceholderText('Enter text');
      fireEvent.change(input, { target: { value: 'Test input' } });
      expect(input.value).toBe('Test input');
    });
  });

  it('should handle file upload', async () => {
    responseService.getFormById.mockResolvedValue(mockForm);

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
  });

  it('should handle invalid file type', async () => {
    responseService.getFormById.mockResolvedValue(mockForm);

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['content'], 'test.exe', { type: 'application/exe' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      expect(toast.error).toHaveBeenCalledWith('File type not allowed. Please upload PDF, Word, or image files.');
    });
  });

  it('should handle large file', async () => {
    responseService.getFormById.mockResolvedValue(mockForm);

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const fileInput = document.querySelector('input[type="file"]');
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
      expect(toast.error).toHaveBeenCalledWith('File size must be less than 5MB');
    });
  });

  it('should show clear form modal', async () => {
    responseService.getFormById.mockResolvedValue(mockForm);

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const clearButton = screen.getByText('Clear Form');
      fireEvent.click(clearButton);
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  it('should clear form when confirmed', async () => {
    responseService.getFormById.mockResolvedValue(mockForm);

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const clearButton = screen.getByText('Clear Form');
      fireEvent.click(clearButton);
    });

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    expect(toast.success).toHaveBeenCalledWith('Form cleared successfully');
  });

  it('should validate required fields on submit', async () => {
    responseService.getFormById.mockResolvedValue(mockForm);

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
    });

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Please answer:'));
  });

  it('should validate required file upload', async () => {
    const formWithFileRequired = {
      ...mockForm,
      questions: [{
        id: 'q1',
        text: 'File question',
        type: 'file_upload',
        required: true
      }]
    };
    responseService.getFormById.mockResolvedValue(formWithFileRequired);

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
    });

    expect(toast.error).toHaveBeenCalledWith('Please upload file for: File question');
  });

  it('should validate required checkbox', async () => {
    const formWithCheckbox = {
      ...mockForm,
      questions: [{
        id: 'q1',
        text: 'Checkbox question',
        type: 'checkbox',
        multiple_choice: true,
        required: true,
        options: ['Option 1']
      }]
    };
    responseService.getFormById.mockResolvedValue(formWithCheckbox);

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
    });

    expect(toast.error).toHaveBeenCalledWith('Please answer: Checkbox question');
  });

  it('should submit form successfully', async () => {
    const simpleForm = {
      formId: 'form123',
      title: 'Simple Form',
      questions: [{
        id: 'q1',
        text: 'Text question',
        type: 'short_text',
        required: false
      }]
    };
    
    responseService.getFormById.mockResolvedValue(simpleForm);
    responseService.submitResponse.mockResolvedValue({
      success: true,
      responseId: 'resp123'
    });

    // Mock FileReader
    global.FileReader = class FileReader {
      readAsDataURL() {
        this.onload({ target: { result: 'data:image/png;base64,abc123' } });
      }
    };

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Test answer' } });
    });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(responseService.submitResponse).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Form submitted successfully!');
    });
  });

  it('should handle submit error with response message', async () => {
    const simpleForm = {
      formId: 'form123',
      title: 'Simple Form',
      questions: [{
        id: 'q1',
        text: 'Text',
        type: 'short_text',
        required: false
      }]
    };
    
    responseService.getFormById.mockResolvedValue(simpleForm);
    responseService.submitResponse.mockRejectedValue({
      response: { data: { message: 'Submit failed' } }
    });

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Submit failed');
    });
  });

  it('should handle submit error without response message', async () => {
    const simpleForm = {
      formId: 'form123',
      title: 'Simple Form',
      questions: [{
        id: 'q1',
        text: 'Text',
        type: 'short_text',
        required: false
      }]
    };
    
    responseService.getFormById.mockResolvedValue(simpleForm);
    responseService.submitResponse.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to submit form. Please try again.');
    });
  });

  it('should handle submit with unsuccessful result', async () => {
    const simpleForm = {
      formId: 'form123',
      title: 'Simple Form',
      questions: [{
        id: 'q1',
        text: 'Text',
        type: 'short_text',
        required: false
      }]
    };
    
    responseService.getFormById.mockResolvedValue(simpleForm);
    responseService.submitResponse.mockResolvedValue({
      success: false,
      message: 'Validation failed'
    });

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Validation failed');
    });
  });

  it('should show success card after submission', async () => {
    const simpleForm = {
      formId: 'form123',
      title: 'Simple Form',
      questions: []
    };
    
    responseService.getFormById.mockResolvedValue(simpleForm);
    responseService.submitResponse.mockResolvedValue({
      success: true,
      responseId: 'resp123'
    });

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Submitted Successfully!')).toBeInTheDocument();
      expect(screen.getByText(/Response ID: #resp123/)).toBeInTheDocument();
    });
  });

  it('should navigate to submissions on success button click', async () => {
    const simpleForm = {
      formId: 'form123',
      title: 'Simple Form',
      questions: []
    };
    
    responseService.getFormById.mockResolvedValue(simpleForm);
    responseService.submitResponse.mockResolvedValue({
      success: true,
      responseId: 'resp123'
    });

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      const goToSubmissionsBtn = screen.getByText('Go to My Submissions');
      fireEvent.click(goToSubmissionsBtn);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/learner/dashboard', { state: { activeTab: 'submissions' } });
  });

  it('should show not found when form is null', async () => {
    responseService.getFormById.mockResolvedValue(null);

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Form Not Found')).toBeInTheDocument();
    });
  });

  it('should handle all question types', async () => {
    responseService.getFormById.mockResolvedValue(mockForm);

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Test textarea for long text
      const textarea = screen.getByPlaceholderText('Enter your detailed answer');
      fireEvent.change(textarea, { target: { value: 'Long answer' } });

      // Test date input
      const dateInputs = document.querySelectorAll('input[type="date"]');
      dateInputs.forEach(input => {
        fireEvent.change(input, { target: { value: '2024-01-01' } });
      });

      // Test number input
      const numberInputs = document.querySelectorAll('input[type="number"]');
      numberInputs.forEach(input => {
        fireEvent.change(input, { target: { value: '5' } });
      });

      // Test select dropdown
      const selectElements = screen.getAllByRole('combobox');
      selectElements.forEach(select => {
        fireEvent.change(select, { target: { value: 'Opt A' } });
      });

      // Test checkbox
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        fireEvent.click(checkbox);
      });

      // Test radio buttons
      const radios = document.querySelectorAll('input[type="radio"]');
      if (radios.length > 0) {
        fireEvent.click(radios[0]);
      }
    });
  });

  it('should handle file upload with conversion error', async () => {
    const formWithFile = {
      formId: 'form123',
      title: 'Form with File',
      questions: [{
        id: 'q1',
        text: 'Upload file',
        type: 'file_upload',
        required: false
      }]
    };

    responseService.getFormById.mockResolvedValue(formWithFile);

    // Mock FileReader to throw error
    global.FileReader = class FileReader {
      readAsDataURL() {
        this.onerror(new Error('Read error'));
      }
    };

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error processing file: test.pdf');
    });
  });

  it('should remove uploaded file', async () => {
    responseService.getFormById.mockResolvedValue(mockForm);

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);
    });
  });

  it('should prevent double submission', async () => {
    const simpleForm = {
      formId: 'form123',
      title: 'Simple Form',
      questions: []
    };
    
    responseService.getFormById.mockResolvedValue(simpleForm);
    responseService.submitResponse.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      fireEvent.click(submitButton); // Try double click
    });

    // Should only be called once
    expect(responseService.submitResponse).toHaveBeenCalledTimes(1);
  });

  it('should handle file upload questions with file', async () => {
    const formWithFile = {
      formId: 'form123',
      title: 'Form',
      questions: [{
        id: 'q1',
        text: 'Upload',
        type: 'file',
        required: false
      }]
    };

    responseService.getFormById.mockResolvedValue(formWithFile);
    responseService.submitResponse.mockResolvedValue({ success: true });

    global.FileReader = class FileReader {
      readAsDataURL() {
        this.onload({ target: { result: 'data:application/pdf;base64,abc' } });
      }
    };

    render(
      <BrowserRouter>
        <FormSubmission />
      </BrowserRouter>
    );

    await waitFor(() => {
      const fileInput = document.querySelector('input[type="file"]');
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(responseService.submitResponse).toHaveBeenCalled();
    });
  });
});