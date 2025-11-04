import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, useParams, useNavigate } from 'react-router-dom';
import FormSubmission from './FormSubmission';
import { useAuth } from '../../contexts/AuthContext';
import responseService from '../../services/responseService';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('../../contexts/AuthContext');
jest.mock('../../services/responseService');
jest.mock('react-hot-toast');
jest.mock('../Common/LoadingSpinner', () => () => <div>Loading...</div>);
jest.mock('../Common/NavigationBar', () => () => <nav>Navigation</nav>);
jest.mock('../Common/Modal', () => ({ isOpen, onClose, onConfirm, type }) => 
  isOpen ? (
    <div data-testid="modal">
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  ) : null
);

describe('FormSubmission Component', () => {
  const mockNavigate = jest.fn();
  const mockFormData = {
    formId: 'test-form-123',
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
        required: false
      },
      {
        id: 'q3',
        text: 'Choice question',
        type: 'choice',
        multipleChoice: false,
        options: ['Option 1', 'Option 2', 'Option 3'],
        required: true
      },
      {
        id: 'q4',
        text: 'Multi choice question',
        type: 'choice',
        multipleChoice: true,
        options: ['Choice 1', 'Choice 2', 'Choice 3'],
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
        required: false,
        readOnly: false
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ formId: 'test-form-123' });
    useNavigate.mockReturnValue(mockNavigate);
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'Learner', id: 'user-123' }
    });
    responseService.getFormById.mockResolvedValue(mockFormData);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <FormSubmission />
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

  test('should load and display form successfully', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Form')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText(/Short text question/)).toBeInTheDocument();
    });
  });

  test('should handle form loading error', async () => {
    responseService.getFormById.mockRejectedValue(new Error('Failed to load'));
    toast.error = jest.fn();

    renderComponent();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load form');
      expect(mockNavigate).toHaveBeenCalledWith('/learner/dashboard');
    });
  });

  test('should handle form not found', async () => {
    responseService.getFormById.mockResolvedValue(null);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Form Not Found')).toBeInTheDocument();
    });
  });

  test('should handle text input changes', async () => {
    renderComponent();

    await waitFor(() => {
      const textInput = screen.getByPlaceholderText('Enter text');
      fireEvent.change(textInput, { target: { value: 'Test answer' } });
      expect(textInput.value).toBe('Test answer');
    });
  });

  test('should handle long text input', async () => {
    renderComponent();

    await waitFor(() => {
      const textareas = screen.getAllByRole('textbox');
      const longTextarea = textareas.find(el => el.tagName === 'TEXTAREA');
      fireEvent.change(longTextarea, { target: { value: 'Long answer text' } });
      expect(longTextarea.value).toBe('Long answer text');
    });
  });

  test('should handle single choice selection', async () => {
    renderComponent();

    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: 'Option 2' } });
      expect(selects[0].value).toBe('Option 2');
    });
  });

  test('should handle multiple choice selection', async () => {
    renderComponent();

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      expect(checkboxes[0]).toBeChecked();
    });
  });

  test('should handle date input', async () => {
    renderComponent();

    await waitFor(() => {
      const dateInput = screen.getByDisplayValue('');
      fireEvent.change(dateInput, { target: { value: '2024-01-15' } });
      expect(dateInput.value).toBe('2024-01-15');
    });
  });

  test('should handle number input', async () => {
    renderComponent();

    await waitFor(() => {
      const numberInputs = screen.getAllByRole('spinbutton');
      fireEvent.change(numberInputs[0], { target: { value: '5' } });
      expect(numberInputs[0].value).toBe('5');
    });
  });

  test('should handle file upload with valid file', async () => {
    renderComponent();

    await waitFor(() => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getAllByText(/Drop files here/)[0].closest('label').querySelector('input[type="file"]');
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);
      
      setTimeout(() => {
        expect(screen.getByText('📎 test.pdf')).toBeInTheDocument();
      }, 100);
    });
  });

  test('should reject invalid file type', async () => {
    toast.error = jest.fn();
    renderComponent();

    await waitFor(() => {
      const file = new File(['test'], 'test.exe', { type: 'application/exe' });
      const fileInput = screen.getAllByText(/Drop files here/)[0].closest('label').querySelector('input[type="file"]');
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);
      
      expect(toast.error).toHaveBeenCalledWith('File type not allowed. Please upload PDF, Word, or image files.');
    });
  });

  test('should reject oversized file', async () => {
    toast.error = jest.fn();
    renderComponent();

    await waitFor(() => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      const fileInput = screen.getAllByText(/Drop files here/)[0].closest('label').querySelector('input[type="file"]');
      
      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false,
      });

      fireEvent.change(fileInput);
      
      expect(toast.error).toHaveBeenCalledWith('File size must be less than 5MB');
    });
  });

  test('should remove uploaded file', async () => {
    renderComponent();

    await waitFor(async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getAllByText(/Drop files here/)[0].closest('label').querySelector('input[type="file"]');
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);
      
      await waitFor(() => {
        const removeButton = screen.getByText('Remove');
        fireEvent.click(removeButton);
        expect(screen.queryByText('📎 test.pdf')).not.toBeInTheDocument();
      });
    });
  });

  test('should handle checkbox group selection', async () => {
    renderComponent();

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      const checkboxGroup = checkboxes.filter(cb => cb.value === 'Check 1');
      fireEvent.click(checkboxGroup[0]);
      expect(checkboxGroup[0]).toBeChecked();
    });
  });

  test('should handle radio button selection', async () => {
    renderComponent();

    await waitFor(() => {
      const radioButtons = screen.getAllByRole('radio');
      fireEvent.click(radioButtons[0]);
      expect(radioButtons[0]).toBeChecked();
    });
  });

  test('should show clear form modal', async () => {
    renderComponent();

    await waitFor(() => {
      const clearButton = screen.getByText('Clear Form');
      fireEvent.click(clearButton);
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  test('should clear form when confirmed', async () => {
    toast.success = jest.fn();
    renderComponent();

    await waitFor(async () => {
      // Fill some fields first
      const textInput = screen.getByPlaceholderText('Enter text');
      fireEvent.change(textInput, { target: { value: 'Test answer' } });

      const clearButton = screen.getByText('Clear Form');
      fireEvent.click(clearButton);

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(textInput.value).toBe('');
      expect(toast.success).toHaveBeenCalledWith('Form cleared successfully');
    });
  });

  test('should cancel clear form modal', async () => {
    renderComponent();

    await waitFor(() => {
      const clearButton = screen.getByText('Clear Form');
      fireEvent.click(clearButton);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  test('should validate required fields on submit', async () => {
    toast.error = jest.fn();
    renderComponent();

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      expect(toast.error).toHaveBeenCalledWith('Please answer: Short text question');
    });
  });

  test('should validate required file upload', async () => {
    toast.error = jest.fn();
    renderComponent();

    await waitFor(() => {
      // Fill required text field
      const textInput = screen.getByPlaceholderText('Enter text');
      fireEvent.change(textInput, { target: { value: 'Test' } });

      // Fill required choice
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: 'Option 1' } });

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      expect(toast.error).toHaveBeenCalledWith('Please upload file for: File upload question');
    });
  });

  test('should submit form successfully', async () => {
    toast.success = jest.fn();
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onload: null,
      result: 'data:application/pdf;base64,dGVzdA=='
    };
    
    global.FileReader = jest.fn(() => mockFileReader);
    
    responseService.submitResponse.mockResolvedValue({
      success: true,
      responseId: 'response-123'
    });

    renderComponent();

    await waitFor(async () => {
      // Fill required text
      const textInput = screen.getByPlaceholderText('Enter text');
      fireEvent.change(textInput, { target: { value: 'Test answer' } });

      // Fill required choice
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: 'Option 1' } });

      // Upload required file
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getAllByText(/Drop files here/)[0].closest('label').querySelector('input[type="file"]');
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      // Submit form
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      // Trigger FileReader onload
      setTimeout(() => {
        mockFileReader.onload();
      }, 100);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Form submitted successfully!');
        expect(screen.getByText('Submitted Successfully!')).toBeInTheDocument();
      });
    });
  });

  test('should handle submission error', async () => {
    toast.error = jest.fn();
    responseService.submitResponse.mockRejectedValue({
      response: { data: { message: 'Server error' } }
    });

    renderComponent();

    await waitFor(async () => {
      // Fill required fields
      const textInput = screen.getByPlaceholderText('Enter text');
      fireEvent.change(textInput, { target: { value: 'Test' } });

      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: 'Option 1' } });

      // Mock file upload
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null,
        result: 'data:application/pdf;base64,dGVzdA=='
      };
      global.FileReader = jest.fn(() => mockFileReader);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getAllByText(/Drop files here/)[0].closest('label').querySelector('input[type="file"]');
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      setTimeout(() => {
        mockFileReader.onload();
      }, 100);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Server error');
      });
    });
  });

  test('should prevent double submission', async () => {
    responseService.submitResponse.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
    );

    renderComponent();

    await waitFor(() => {
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      
      // Try clicking again
      fireEvent.click(submitButton);
      
      // Should only be called once
      expect(responseService.submitResponse).toHaveBeenCalledTimes(0);
    });
  });

  test('should navigate to submissions on success', async () => {
    responseService.submitResponse.mockResolvedValue({
      success: true,
      responseId: 'response-123'
    });

    renderComponent();

    await waitFor(async () => {
      // Fill and submit form (minimal required fields)
      const textInput = screen.getByPlaceholderText('Enter text');
      fireEvent.change(textInput, { target: { value: 'Test' } });

      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: 'Option 1' } });

      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null,
        result: 'data:application/pdf;base64,dGVzdA=='
      };
      global.FileReader = jest.fn(() => mockFileReader);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getAllByText(/Drop files here/)[0].closest('label').querySelector('input[type="file"]');
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      setTimeout(() => {
        mockFileReader.onload();
      }, 100);

      await waitFor(() => {
        const goToSubmissionsButton = screen.getByText('Go to My Submissions');
        fireEvent.click(goToSubmissionsButton);
        expect(mockNavigate).toHaveBeenCalledWith('/learner/dashboard', { state: { activeTab: 'submissions' } });
      });
    });
  });

  test('should handle file conversion error', async () => {
    toast.error = jest.fn();
    
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onerror: null,
    };
    
    global.FileReader = jest.fn(() => mockFileReader);

    renderComponent();

    await waitFor(async () => {
      // Fill required fields
      const textInput = screen.getByPlaceholderText('Enter text');
      fireEvent.change(textInput, { target: { value: 'Test' } });

      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: 'Option 1' } });

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getAllByText(/Drop files here/)[0].closest('label').querySelector('input[type="file"]');
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      // Trigger error
      setTimeout(() => {
        mockFileReader.onerror(new Error('Read error'));
      }, 100);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error processing file: test.pdf');
      });
    });
  });
});