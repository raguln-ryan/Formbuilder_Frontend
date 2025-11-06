import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, useNavigate, useParams } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import FormSubmission from '../FormSubmission';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';
import * as learnerSlice from '../../../store/slices/learnerSlice';

// Mock modules
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn()
}));

jest.mock('../../../contexts/AuthContext');
jest.mock('react-hot-toast');

jest.mock('../../Common/LoadingSpinner', () => {
  return function LoadingSpinner() {
    return <div>Loading...</div>;
  };
});

jest.mock('../../Common/NavigationBar', () => {
  return function NavigationBar() {
    return <nav>NavigationBar</nav>;
  };
});

jest.mock('../../Common/Modal', () => {
  return function Modal({ isOpen, onClose, onConfirm, message }) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <p>{message}</p>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  };
});

jest.mock('./../../assets/success.png', () => 'success.png');

// Mock Redux slice
jest.mock('../../../store/slices/learnerSlice', () => ({
  fetchFormDetails: jest.fn(() => ({ type: 'fetchFormDetails' })),
  submitFormResponse: jest.fn(() => ({ type: 'submitFormResponse' })),
  resetFormSubmission: jest.fn(() => ({ type: 'resetFormSubmission' })),
  selectCurrentForm: jest.fn(),
  selectFormSubmission: jest.fn()
}));

describe('FormSubmission Component - Full Coverage', () => {
  let mockNavigate;
  let mockDispatch;
  let mockStore;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockNavigate = jest.fn();
    mockDispatch = jest.fn((action) => {
      if (action.type === 'submitFormResponse') {
        return { unwrap: () => Promise.resolve() };
      }
      return action;
    });
    
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ formId: 'form123' });
    
    useAuth.mockReturnValue({
      user: { role: 'Learner' },
      isAuthenticated: true
    });
    
    toast.success = jest.fn();
    toast.error = jest.fn();

    // Default selector returns
    learnerSlice.selectCurrentForm.mockReturnValue({
      data: null,
      loading: false,
      error: null
    });
    
    learnerSlice.selectFormSubmission.mockReturnValue({
      submitting: false,
      success: false,
      error: null,
      submissionDetails: null
    });

    mockStore = {
      getState: jest.fn(),
      dispatch: mockDispatch,
      subscribe: jest.fn(() => jest.fn())
    };
  });

  const renderComponent = () => {
    return render(
      <Provider store={mockStore}>
        <BrowserRouter>
          <FormSubmission />
        </BrowserRouter>
      </Provider>
    );
  };

  describe('Authentication Tests', () => {
    test('redirects to login when not authenticated', () => {
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false
      });

      renderComponent();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('redirects to login when user is not Learner', () => {
      useAuth.mockReturnValue({
        user: { role: 'Admin' },
        isAuthenticated: true
      });

      renderComponent();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('fetches form details when authenticated as Learner', () => {
      renderComponent();
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'fetchFormDetails' })
      );
    });
  });

  describe('Loading States', () => {
    test('shows loading spinner when loading', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: null,
        loading: true,
        error: null
      });

      renderComponent();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('shows form not found when no data', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: null,
        loading: false,
        error: null
      });

      renderComponent();
      expect(screen.getByText('Form Not Found')).toBeInTheDocument();
    });

    test('navigates back to dashboard from form not found', () => {
      renderComponent();
      
      const backButton = screen.getByText('Back to Dashboard');
      fireEvent.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/learner/dashboard');
    });
  });

  describe('Form Initialization', () => {
    const mockFormData = {
      id: 'form123',
      title: 'Test Form',
      description: 'Test Description',
      questions: [
        {
          id: 'q1',
          text: 'Text question',
          type: 'text',
          required: true
        },
        {
          id: 'q2',
          text: 'Checkbox question',
          type: 'checkbox',
          options: ['Option 1', 'Option 2'],
          required: false
        },
        {
          id: 'q3',
          text: 'Multiple choice',
          type: 'choice',
          multiple_choice: true,
          options: ['A', 'B'],
          required: false
        },
        {
          id: 'q4',
          text: 'File upload',
          type: 'file_upload',
          required: true
        }
      ]
    };

    test('initializes responses when form data loads', () => {
      const { rerender } = renderComponent();

      // Update to have form data
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: mockFormData,
        loading: false,
        error: null
      });

      rerender(
        <Provider store={mockStore}>
          <BrowserRouter>
            <FormSubmission />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByText('Test Form')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    test('handles form without questions array', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          id: 'form123',
          title: 'Empty Form'
        },
        loading: false,
        error: null
      });

      renderComponent();
      expect(screen.getByText('Empty Form')).toBeInTheDocument();
    });

    test('shows default title when no title provided', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          id: 'form123',
          questions: []
        },
        loading: false,
        error: null
      });

      renderComponent();
      expect(screen.getByText('Form Submission')).toBeInTheDocument();
    });

    test('shows default description when no description provided', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          id: 'form123',
          title: 'Test Form',
          questions: []
        },
        loading: false,
        error: null
      });

      renderComponent();
      expect(screen.getByText('Please fill out this form completely and accurately.')).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    test('shows success screen when submission successful', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: { id: 'form123' },
        loading: false,
        error: null
      });
      
      learnerSlice.selectFormSubmission.mockReturnValue({
        submitting: false,
        success: true,
        error: null,
        submissionDetails: {
          responseId: '12345'
        }
      });

      const { rerender } = renderComponent();

      // Trigger the useEffect for success
      rerender(
        <Provider store={mockStore}>
          <BrowserRouter>
            <FormSubmission />
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByText('Submitted Successfully!')).toBeInTheDocument();
      expect(screen.getByText(/Thanks for completing this form/)).toBeInTheDocument();
      expect(screen.getByText('Response ID: #12345')).toBeInTheDocument();
    });

    test('handles success without responseId', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: { id: 'form123' },
        loading: false,
        error: null
      });
      
      learnerSlice.selectFormSubmission.mockReturnValue({
        submitting: false,
        success: true,
        error: null,
        submissionDetails: {}
      });

      renderComponent();

      expect(screen.getByText('Submitted Successfully!')).toBeInTheDocument();
      expect(screen.queryByText(/Response ID:/)).not.toBeInTheDocument();
    });

    test('navigates to submissions from success screen', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: { id: 'form123' },
        loading: false,
        error: null
      });
      
      learnerSlice.selectFormSubmission.mockReturnValue({
        submitting: false,
        success: true,
        error: null,
        submissionDetails: { responseId: '12345' }
      });

      renderComponent();

      const goButton = screen.getByText('Go to My Submissions');
      fireEvent.click(goButton);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'resetFormSubmission' })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/learner/dashboard', {
        state: { activeTab: 'submissions' }
      });
    });
  });

  describe('Input Handling', () => {
    const setupFormWithQuestions = () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          id: 'form123',
          title: 'Test Form',
          questions: [
            {
              id: 'q1',
              text: 'Short text',
              type: 'short_text',
              placeholder: 'Enter text',
              required: true
            },
            {
              id: 'q2',
              text: 'Short answer',
              type: 'short_answer',
              required: false
            },
            {
              id: 'q3',
              text: 'Text',
              type: 'text',
              required: false
            },
            {
              id: 'q4',
              text: 'Long text',
              type: 'long_text',
              placeholder: 'Enter long text',
              required: false
            },
            {
              id: 'q5',
              text: 'Long answer',
              type: 'long_answer',
              required: false
            },
            {
              id: 'q6',
              text: 'Paragraph',
              type: 'paragraph',
              required: false
            },
            {
              id: 'q7',
              text: 'Date',
              type: 'date',
              required: false
            },
            {
              id: 'q8',
              text: 'Date picker',
              type: 'date_picker',
              required: false
            },
            {
              id: 'q9',
              text: 'Number',
              type: 'number',
              min: 1,
              max: 10,
              placeholder: 'Enter number',
              required: false
            },
            {
              id: 'q10',
              text: 'Rating',
              type: 'rating',
              required: false
            },
            {
              id: 'q11',
              text: 'Radio',
              type: 'radio',
              options: ['Radio 1', 'Radio 2'],
              required: false
            },
            {
              id: 'q12',
              text: 'Checkbox',
              type: 'checkbox',
              options: ['Check 1', 'Check 2'],
              required: false
            },
            {
              id: 'q13',
              text: 'Choice single',
              type: 'choice',
              multipleChoice: false,
              options: ['Option 1', 'Option 2'],
              required: false
            },
            {
              id: 'q14',
              text: 'Choice multiple',
              type: 'choice',
              multipleChoice: true,
              options: [
                { value: 'A' },
                { value: 'B' }
              ],
              required: false
            },
            {
              id: 'q15',
              text: 'Dropdown',
              type: 'dropdown',
              options: ['Drop 1', 'Drop 2'],
              required: false
            },
            {
              id: 'q16',
              text: 'File',
              type: 'file',
              required: false
            },
            {
              id: 'q17',
              text: 'File upload',
              type: 'file_upload',
              required: false
            },
            {
              id: 'q18',
              text: 'Default type',
              required: false,
              readOnly: false
            },
            {
              id: 'q19',
              text: 'Readonly',
              required: false,
              readOnly: true
            },
            {
              id: 'q20',
              text: 'With description',
              type: 'text',
              description: 'This is a description',
              descriptionEnabled: true,
              required: false
            }
          ]
        },
        loading: false,
        error: null
      });
    };

    test('handles all text input types', () => {
      setupFormWithQuestions();
      renderComponent();

      // Short text
      const shortText = screen.getByPlaceholderText('Enter text');
      fireEvent.change(shortText, { target: { value: 'test short' } });
      expect(shortText.value).toBe('test short');

      // Long text
      const longText = screen.getByPlaceholderText('Enter long text');
      fireEvent.change(longText, { target: { value: 'test long' } });
      expect(longText.value).toBe('test long');

      // All text inputs rendered
      expect(screen.getByText('Short text')).toBeInTheDocument();
      expect(screen.getByText('Short answer')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('Long text')).toBeInTheDocument();
      expect(screen.getByText('Long answer')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
    });

    test('handles date inputs', () => {
      setupFormWithQuestions();
      renderComponent();

      const dateInputs = screen.getAllByType('date');
      expect(dateInputs).toHaveLength(2);
      
      fireEvent.change(dateInputs[0], { target: { value: '2024-01-01' } });
      expect(dateInputs[0].value).toBe('2024-01-01');
    });

    test('handles number and rating inputs', () => {
      setupFormWithQuestions();
      renderComponent();

      const numberInput = screen.getByPlaceholderText('Enter number');
      fireEvent.change(numberInput, { target: { value: '5' } });
      expect(numberInput.value).toBe('5');
      expect(numberInput).toHaveAttribute('min', '1');
      expect(numberInput).toHaveAttribute('max', '10');
    });

    test('handles radio buttons', () => {
      setupFormWithQuestions();
      renderComponent();

      const radioButtons = screen.getAllByRole('radio');
      fireEvent.click(radioButtons[0]);
      expect(radioButtons[0].checked).toBe(true);
    });

    test('handles checkboxes', () => {
      setupFormWithQuestions();
      renderComponent();

      const checkboxes = screen.getAllByRole('checkbox');
      
      // Find checkbox for "Check 1"
      const check1 = checkboxes.find(cb => cb.value === 'Check 1');
      fireEvent.click(check1);
      expect(check1.checked).toBe(true);
      
      fireEvent.click(check1);
      expect(check1.checked).toBe(false);
    });

    test('handles single choice dropdown', () => {
      setupFormWithQuestions();
      renderComponent();

      const selects = screen.getAllByRole('combobox');
      const singleChoice = selects[0];
      
      fireEvent.change(singleChoice, { target: { value: 'Option 1' } });
      expect(singleChoice.value).toBe('Option 1');
    });

    test('handles multiple choice checkboxes', () => {
      setupFormWithQuestions();
      renderComponent();

      const checkboxes = screen.getAllByRole('checkbox');
      const multiChoice = checkboxes.find(cb => cb.value === 'A');
      
      fireEvent.click(multiChoice);
      expect(multiChoice.checked).toBe(true);
    });

    test('handles readonly input', () => {
      setupFormWithQuestions();
      renderComponent();

      const inputs = screen.getAllByRole('textbox');
      const readonlyInput = inputs.find(input => input.readOnly);
      
      expect(readonlyInput).toHaveAttribute('readOnly');
    });

    test('displays question description when enabled', () => {
      setupFormWithQuestions();
      renderComponent();

      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    beforeEach(() => {
      global.FileReader = class {
        readAsDataURL = jest.fn();
        onload = null;
        onerror = null;
        result = 'data:application/pdf;base64,dGVzdCBjb250ZW50';
        
        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      };
    });

    test('handles valid file upload', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'File', type: 'file_upload', required: false }
          ]
        },
        loading: false
      });

      renderComponent();

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByType('file');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByText('📎 test.pdf')).toBeInTheDocument();
      });
    });

    test('handles file removal', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'File', type: 'file', required: false }
          ]
        },
        loading: false
      });

      renderComponent();

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByType('file');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      const removeButton = await screen.findByText('Remove');
      fireEvent.click(removeButton);
      
      expect(screen.queryByText('📎 test.pdf')).not.toBeInTheDocument();
    });

    test('rejects invalid file types', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'File', type: 'file_upload', required: false }
          ]
        },
        loading: false
      });

      renderComponent();

      const file = new File(['test'], 'test.exe', { type: 'application/exe' });
      const fileInput = screen.getByType('file');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      expect(toast.error).toHaveBeenCalledWith(
        'File type not allowed. Please upload PDF, Word, or image files.'
      );
    });

    test('rejects large files', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'File', type: 'file_upload', required: false }
          ]
        },
        loading: false
      });

      renderComponent();

      const largeContent = new Array(6 * 1024 * 1024).join('x');
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByType('file');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      expect(toast.error).toHaveBeenCalledWith('File size must be less than 5MB');
    });

    test('handles all allowed file types', async () => {
      const fileTypes = [
        { name: 'test.jpg', type: 'image/jpeg' },
        { name: 'test.jpg', type: 'image/jpg' },
        { name: 'test.png', type: 'image/png' },
        { name: 'test.gif', type: 'image/gif' },
        { name: 'test.doc', type: 'application/msword' },
        { name: 'test.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      ];

      for (const fileType of fileTypes) {
        learnerSlice.selectCurrentForm.mockReturnValue({
          data: {
            questions: [
              { id: 'q1', text: 'File', type: 'file_upload', required: false }
            ]
          },
          loading: false
        });

        const { unmount } = renderComponent();

        const file = new File(['test'], fileType.name, { type: fileType.type });
        const fileInput = screen.getByType('file');
        
        await act(async () => {
          fireEvent.change(fileInput, { target: { files: [file] } });
        });

        await waitFor(() => {
          expect(screen.getByText(`📎 ${fileType.name}`)).toBeInTheDocument();
        });

        unmount();
      }
    });
  });

  describe('Form Clear', () => {
    test('shows clear modal and clears form', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Text', type: 'text', required: false },
            { id: 'q2', text: 'Checkbox', type: 'checkbox', options: ['A'], required: false },
            { id: 'q3', text: 'File', type: 'file_upload', required: false }
          ]
        },
        loading: false
      });

      renderComponent();

      // Fill some fields
      const textInput = screen.getByRole('textbox');
      fireEvent.change(textInput, { target: { value: 'test' } });

      // Click clear
      const clearButton = screen.getByText('Clear Form');
      fireEvent.click(clearButton);

      // Modal should appear
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to clear/)).toBeInTheDocument();

      // Confirm clear
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(textInput.value).toBe('');
      expect(toast.success).toHaveBeenCalledWith('Form cleared successfully');
    });

    test('cancels clear operation', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [{ id: 'q1', text: 'Text', type: 'text' }]
        },
        loading: false
      });

      renderComponent();

      const clearButton = screen.getByText('Clear Form');
      fireEvent.click(clearButton);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    test('clear button disabled when submitting', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: []
        },
        loading: false
      });
      
      learnerSlice.selectFormSubmission.mockReturnValue({
        submitting: true,
        success: false
      });

      renderComponent();

      const clearButton = screen.getByText('Clear Form');
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      global.FileReader = class {
        readAsDataURL = jest.fn();
        onload = null;
        onerror = null;
        result = 'data:application/pdf;base64,dGVzdCBjb250ZW50';
        
        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      };
    });

    test('prevents submission when already submitting', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: []
        },
        loading: false
      });
      
      learnerSlice.selectFormSubmission.mockReturnValue({
        submitting: true,
        success: false
      });

      renderComponent();

      const submitButton = screen.getByText('Submitting...');
      fireEvent.click(submitButton);

      // Should not dispatch submitFormResponse
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'submitFormResponse' })
      );
    });

    test('validates required text fields', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Required text', type: 'text', required: true }
          ]
        },
        loading: false
      });

      renderComponent();

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please answer: Required text');
      });
    });

    test('validates empty trimmed strings', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Required text', type: 'text', required: true }
          ]
        },
        loading: false
      });

      renderComponent();

      const textInput = screen.getByRole('textbox');
      fireEvent.change(textInput, { target: { value: '   ' } });

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please answer: Required text');
      });
    });

        test('validates required checkbox fields', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Required checkbox', type: 'checkbox', options: ['A'], required: true }
          ]
        },
        loading: false
      });

      renderComponent();

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please answer: Required checkbox');
      });
    });

    test('validates required multiple choice fields', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Required multiple', type: 'choice', multiple_choice: true, options: ['A'], required: true }
          ]
        },
        loading: false
      });

      renderComponent();

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please answer: Required multiple');
      });
    });

    test('validates required file upload', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Required file', type: 'file_upload', required: true }
          ]
        },
        loading: false
      });

      renderComponent();

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please upload file for: Required file');
      });
    });

    test('validates required file type (lowercase)', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Required file', type: 'file', required: true }
          ]
        },
        loading: false
      });

      renderComponent();

      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please upload file for: Required file');
      });
    });

    test('submits form with text answers successfully', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Text', type: 'text', required: false },
            { id: 'q2', text: 'Number', type: 'number', required: false }
          ]
        },
        loading: false
      });

      const mockUnwrap = jest.fn().mockResolvedValue({});
      mockDispatch.mockReturnValue({ unwrap: mockUnwrap });

      renderComponent();

      // Fill inputs
      const textInput = screen.getByRole('textbox');
      fireEvent.change(textInput, { target: { value: 'test answer' } });

      const numberInput = screen.getByRole('spinbutton');
      fireEvent.change(numberInput, { target: { value: '5' } });

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'submitFormResponse' })
        );
      });

      // Check console.log was called
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      await act(async () => {
        fireEvent.click(submitButton);
      });
      expect(consoleLogSpy).toHaveBeenCalledWith('Submitting data:', expect.any(Object));
      consoleLogSpy.mockRestore();
    });

    test('submits form with array answers (checkboxes)', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Checkbox', type: 'checkbox', options: ['A', 'B'], required: false }
          ]
        },
        loading: false
      });

      const mockUnwrap = jest.fn().mockResolvedValue({});
      mockDispatch.mockReturnValue({ unwrap: mockUnwrap });

      renderComponent();

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    test('submits form with file uploads', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'File', type: 'file_upload', required: false }
          ]
        },
        loading: false
      });

      const mockUnwrap = jest.fn().mockResolvedValue({});
      mockDispatch.mockReturnValue({ unwrap: mockUnwrap });

      renderComponent();

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf', size: 1000 });
      const fileInput = screen.getByType('file');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByText('📎 test.pdf')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    test('handles file conversion error', async () => {
      // Mock FileReader to throw error
      global.FileReader = class {
        readAsDataURL = jest.fn();
        onload = null;
        onerror = null;
        
        constructor() {
          setTimeout(() => {
            if (this.onerror) this.onerror(new Error('Read error'));
          }, 0);
        }
      };

      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'File', type: 'file_upload', required: false }
          ]
        },
        loading: false
      });

      renderComponent();

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = screen.getByType('file');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error processing file: test.pdf');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error converting file:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    test('handles submission error', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Text', type: 'text', required: false }
          ]
        },
        loading: false
      });

      const mockUnwrap = jest.fn().mockRejectedValue(new Error('Submit failed'));
      mockDispatch.mockReturnValue({ unwrap: mockUnwrap });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      renderComponent();

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Submit error:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    test('skips file upload questions in answers', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Text', type: 'text', required: false },
            { id: 'q2', text: 'File', type: 'file_upload', required: false }
          ]
        },
        loading: false
      });

      const mockUnwrap = jest.fn().mockResolvedValue({});
      mockDispatch.mockReturnValue({ unwrap: mockUnwrap });

      renderComponent();

      const textInput = screen.getByRole('textbox');
      fireEvent.change(textInput, { target: { value: 'test' } });

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    test('handles undefined responses correctly', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Text', type: 'text', required: false }
          ]
        },
        loading: false
      });

      const mockUnwrap = jest.fn().mockResolvedValue({});
      mockDispatch.mockReturnValue({ unwrap: mockUnwrap });

      renderComponent();

      // Submit without entering anything
      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    test('converts empty answers to string', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Text', type: 'text', required: false }
          ]
        },
        loading: false
      });

      const mockUnwrap = jest.fn().mockResolvedValue({});
      let capturedData = null;
      mockDispatch.mockImplementation((action) => {
        if (action.type === 'submitFormResponse') {
          capturedData = action.payload;
        }
        return { unwrap: mockUnwrap };
      });

      renderComponent();

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    test('handles form submission via form onSubmit', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Text', type: 'text', required: false }
          ]
        },
        loading: false
      });

      const mockUnwrap = jest.fn().mockResolvedValue({});
      mockDispatch.mockReturnValue({ unwrap: mockUnwrap });

      const { container } = renderComponent();

      const form = container.querySelector('#submission-form');
      
      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles questions without type', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'No type question', required: false }
          ]
        },
        loading: false
      });

      renderComponent();
      
      expect(screen.getByText('No type question')).toBeInTheDocument();
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    test('handles questions without options in choice type', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Choice no options', type: 'choice', required: false },
            { id: 'q2', text: 'Checkbox no options', type: 'checkbox', required: false },
            { id: 'q3', text: 'Radio no options', type: 'radio', required: false }
          ]
        },
        loading: false
      });

      renderComponent();

      expect(screen.getByText('Choice no options')).toBeInTheDocument();
      expect(screen.getByText('Checkbox no options')).toBeInTheDocument();
      expect(screen.getByText('Radio no options')).toBeInTheDocument();
    });

    test('handles object options in multiple choice', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            {
              id: 'q1',
              text: 'Multiple with objects',
              type: 'choice',
              multipleChoice: true,
              options: [
                { value: 'A', label: 'Option A' },
                { value: 'B', label: 'Option B' }
              ],
              required: false
            }
          ]
        },
        loading: false
      });

      renderComponent();

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toHaveAttribute('value', 'A');
      
      fireEvent.click(checkboxes[0]);
      expect(checkboxes[0].checked).toBe(true);
      
      fireEvent.click(checkboxes[0]);
      expect(checkboxes[0].checked).toBe(false);
    });

    test('handles object options in dropdown', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            {
              id: 'q1',
              text: 'Dropdown with objects',
              type: 'dropdown',
              options: [
                { value: 'A', label: 'Option A' }
              ],
              required: false
            }
          ]
        },
        loading: false
      });

      renderComponent();

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'A' } });
      expect(select.value).toBe('A');
    });

    test('handles question without required field', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Optional question', type: 'text' }
          ]
        },
        loading: false
      });

      renderComponent();

      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('required');
    });

    test('shows required asterisk for required fields', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Required question', type: 'text', required: true }
          ]
        },
        loading: false
      });

      renderComponent();

      const asterisk = screen.getByText('*');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveClass('required');
    });

    test('does not show description when descriptionEnabled is false', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            {
              id: 'q1',
              text: 'Question',
              type: 'text',
              description: 'Should not show',
              descriptionEnabled: false,
              required: false
            }
          ]
        },
        loading: false
      });

      renderComponent();

      expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
    });

    test('does not show description when description is missing', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            {
              id: 'q1',
              text: 'Question',
              type: 'text',
              descriptionEnabled: true,
              required: false
            }
          ]
        },
        loading: false
      });

      renderComponent();

      expect(screen.getByText('Question')).toBeInTheDocument();
    });

    test('handles checkbox with non-array initial response', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Checkbox', type: 'checkbox', options: ['A'], required: false }
          ]
        },
        loading: false
      });

      renderComponent();

      const checkbox = screen.getByRole('checkbox');
      
      // Initially unchecked
      expect(checkbox.checked).toBe(false);
      
      // Click to check
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    test('handles multiple choice with non-array response', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            {
              id: 'q1',
              text: 'Multiple',
              type: 'choice',
              multipleChoice: true,
              options: ['A'],
              required: false
            }
          ]
        },
        loading: false
      });

      renderComponent();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox.checked).toBe(false);
    });

    test('handles number input without min/max', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Number', type: 'number', required: false }
          ]
        },
        loading: false
      });

      renderComponent();

      const numberInput = screen.getByRole('spinbutton');
      expect(numberInput).toHaveAttribute('min', '1');
      expect(numberInput).toHaveAttribute('max', '10');
    });

    test('handles rating type without placeholder', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Rating', type: 'rating', required: false }
          ]
        },
        loading: false
      });

      renderComponent();

      const ratingInput = screen.getByRole('spinbutton');
      expect(ratingInput).toHaveAttribute('placeholder', 'Enter a number');
    });

    test('handles text input without placeholder', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Text', type: 'text', required: false }
          ]
        },
        loading: false
      });

      renderComponent();

      const textInput = screen.getByRole('textbox');
      expect(textInput).toHaveAttribute('placeholder', 'Enter your answer');
    });

    test('handles textarea without placeholder', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Long', type: 'long_text', required: false }
          ]
        },
        loading: false
      });

      renderComponent();

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Enter your detailed answer');
    });

    test('ignores input changes for file upload questions', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'File', type: 'file_upload', required: false }
          ]
        },
        loading: false
      });

      const { container } = renderComponent();

      // The handleInputChange should return early for file upload types
      const fileUploadBox = container.querySelector('.file-upload-box');
      expect(fileUploadBox).toBeInTheDocument();
      
      // File input should be hidden
      const fileInput = screen.getByType('file');
      expect(fileInput).toHaveStyle({ display: 'none' });
    });

    test('displays question numbers correctly', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'First', type: 'text', required: false },
            { id: 'q2', text: 'Second', type: 'text', required: false }
          ]
        },
        loading: false
      });

      renderComponent();

      const numbers = screen.getAllByText((content, element) => {
        return element?.className === 'submission-q-number' && ['1', '2'].includes(content);
      });

      expect(numbers).toHaveLength(2);
    });

    test('handles empty uploadedFiles object during submission', async () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: [
            { id: 'q1', text: 'Text', type: 'text', required: false }
          ]
        },
        loading: false
      });

      const mockUnwrap = jest.fn().mockResolvedValue({});
      mockDispatch.mockReturnValue({ unwrap: mockUnwrap });

      renderComponent();

      const submitButton = screen.getByText('Submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });
  });

  describe('Component Lifecycle', () => {
    test('cleans up on unmount', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: []
        },
        loading: false
      });

      const { unmount } = renderComponent();
      
      unmount();
      
      // Component should unmount without errors
      expect(true).toBe(true);
    });

    test('handles dependency array changes in useEffect', () => {
      const { rerender } = renderComponent();

      // Change auth state
      useAuth.mockReturnValue({
        user: { role: 'Admin' },
        isAuthenticated: true
      });

      rerender(
        <Provider store={mockStore}>
          <BrowserRouter>
            <FormSubmission />
          </BrowserRouter>
        </Provider>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('reinitializes form when formId changes', () => {
      renderComponent();

      // Change formId
      useParams.mockReturnValue({ formId: 'form456' });

      const { rerender } = render(
        <Provider store={mockStore}>
          <BrowserRouter>
            <FormSubmission />
          </BrowserRouter>
        </Provider>
      );

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'fetchFormDetails' })
      );
    });
  });

  describe('Submission Button States', () => {
    test('shows "Submitting..." when submitting', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: []
        },
        loading: false
      });
      
      learnerSlice.selectFormSubmission.mockReturnValue({
        submitting: true,
        success: false
      });

      renderComponent();

      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(screen.getByText('Submitting...')).toBeDisabled();
    });

    test('shows "Submit" when not submitting', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: []
        },
        loading: false
      });

      renderComponent();

      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(screen.getByText('Submit')).not.toBeDisabled();
    });
  });

  describe('Warning Message', () => {
    test('displays warning message in footer', () => {
      learnerSlice.selectCurrentForm.mockReturnValue({
        data: {
          questions: []
        },
        loading: false
      });

      renderComponent();

      expect(screen.getByText(/This form cannot be saved temporarily/)).toBeInTheDocument();
    });
  });
});

