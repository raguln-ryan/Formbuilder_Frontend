import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import FormSubmissionPage from '../FormSubmissionPage';
import responseService from '../../services/responseService';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ formId: 'test-form-123' }),
  useNavigate: () => mockNavigate
}));

jest.mock('react-hot-toast');
jest.mock('../../services/responseService');
jest.mock('../../components/Common/NavigationBar', () => {
  return function NavigationBar() {
    return <div>NavigationBar</div>;
  };
});

const mockNavigate = jest.fn();

const mockForm = {
  formId: 'test-form-123',
  title: 'Test Form',
  description: 'Test Description',
  questions: [
    {
      id: 'q1',
      text: 'Text Question',
      type: 'text',
      required: true
    },
    {
      id: 'q2',
      text: 'Textarea Question',
      type: 'textarea',
      required: false,
      description: 'This is a description',
      descriptionEnabled: true
    },
    {
      id: 'q3',
      text: 'Radio Question',
      type: 'radio',
      required: true,
      options: ['Option 1', 'Option 2', 'Option 3']
    },
    {
      id: 'q4',
      text: 'Checkbox Question',
      type: 'checkbox',
      required: false,
      options: ['Check 1', 'Check 2', 'Check 3']
    },
    {
      id: 'q5',
      text: 'File Upload Question',
      type: 'fileupload',
      required: false
    },
    {
      id: 'q6',
      text: 'Unknown Type Question',
      type: 'unknown',
      required: false
    }
  ]
};

const mockSubmissions = [
  {
    id: 'sub1',
    submittedAt: '2024-01-01T10:00:00Z'
  },
  {
    id: 'sub2',
    submittedAt: '2024-01-02T10:00:00Z'
  }
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <FormSubmissionPage />
    </BrowserRouter>
  );
};

describe('FormSubmissionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    responseService.getPublishedForms.mockResolvedValue([mockForm]);
    responseService.getMySubmissions.mockResolvedValue(mockSubmissions);
    responseService.submitResponse.mockResolvedValue({ success: true });
  });

  describe('Initial Load and Tab Switching', () => {
    test('renders form submission page with navigation bar', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('NavigationBar')).toBeInTheDocument();
      });
    });

    test('loads form details on mount', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(responseService.getPublishedForms).toHaveBeenCalled();
        expect(screen.getByText('Test Form')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
      });
    });

    test('switches to submissions tab and loads submissions', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      const submissionsTab = screen.getByText('My Submissions');
      fireEvent.click(submissionsTab);

      await waitFor(() => {
        expect(responseService.getMySubmissions).toHaveBeenCalledWith('test-form-123');
        expect(screen.getByText('Submission #sub1')).toBeInTheDocument();
      });
    });

    test('switches back to submit tab from submissions tab', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      // Switch to submissions
      fireEvent.click(screen.getByText('My Submissions'));
      
      await waitFor(() => {
        expect(screen.getByText('Submission #sub1')).toBeInTheDocument();
      });

      // Switch back to submit
      fireEvent.click(screen.getByText('Form Submit'));
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });
    });
  });

  describe('Form Not Found', () => {
    test('handles form not found error', async () => {
      responseService.getPublishedForms.mockResolvedValue([]);
      
      renderComponent();
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Form not found');
        expect(mockNavigate).toHaveBeenCalledWith('/learner/dashboard');
      });
    });

    test('shows error message when form is null', async () => {
      responseService.getPublishedForms.mockResolvedValue([]);
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Form not found')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles error when fetching form fails', async () => {
      responseService.getPublishedForms.mockRejectedValue(new Error('Network error'));
      
      renderComponent();
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load form');
      });
    });

    test('handles error when fetching submissions fails', async () => {
      responseService.getMySubmissions.mockRejectedValue(new Error('Network error'));
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('My Submissions'));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load submissions');
      });
    });
  });

  describe('Form Input Handling', () => {
    test('handles text input change', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      const textInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(textInput, { target: { value: 'Test answer' } });
      
      expect(textInput.value).toBe('Test answer');
    });

    test('handles textarea input change', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      const textareaInput = screen.getAllByRole('textbox')[1];
      fireEvent.change(textareaInput, { target: { value: 'Long answer' } });
      
      expect(textareaInput.value).toBe('Long answer');
    });

    test('handles radio button selection', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      const radioOption = screen.getByLabelText('Option 2');
      fireEvent.click(radioOption);
      
      expect(radioOption).toBeChecked();
    });

    test('handles checkbox selection and deselection', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      const checkbox1 = screen.getByLabelText('Check 1');
      const checkbox2 = screen.getByLabelText('Check 2');
      
      // Select checkboxes
      fireEvent.click(checkbox1);
      fireEvent.click(checkbox2);
      
      expect(checkbox1).toBeChecked();
      expect(checkbox2).toBeChecked();
      
      // Deselect checkbox1
      fireEvent.click(checkbox1);
      expect(checkbox1).not.toBeChecked();
    });

    test('handles checkbox with no previous values', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      const checkbox = screen.getByLabelText('Check 1');
      fireEvent.click(checkbox);
      
      expect(checkbox).toBeChecked();
    });

    test('handles file upload', async () => {
      global.FileReader = class FileReader {
        readAsDataURL() {
          this.onloadend({ target: { result: 'data:text/plain;base64,dGVzdA==' } });
        }
      };

      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      const fileInput = screen.getAllByRole('textbox', { hidden: true }).find(
        el => el.type === 'file'
      ) || document.querySelector('input[type="file"]');
      
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('File test.txt uploaded');
        expect(screen.getByText('Uploaded: test.txt')).toBeInTheDocument();
      });
    });

    test('renders question description when enabled', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('This is a description')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('submits form successfully', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      // Fill required fields
      const textInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(textInput, { target: { value: 'Test answer' } });
      
      const radioOption = screen.getByLabelText('Option 1');
      fireEvent.click(radioOption);
      
      const submitButton = screen.getByText('Submit Form');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(responseService.submitResponse).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('Form submitted successfully!');
      });
    });

    test('validates required fields before submission', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Submit Form');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please answer: Text Question');
        expect(responseService.submitResponse).not.toHaveBeenCalled();
      });
    });

    test('handles submission error', async () => {
      responseService.submitResponse.mockRejectedValue(new Error('Submit failed'));
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      // Fill required fields
      const textInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(textInput, { target: { value: 'Test answer' } });
      
      const radioOption = screen.getByLabelText('Option 1');
      fireEvent.click(radioOption);
      
      const submitButton = screen.getByText('Submit Form');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to submit form');
      });
    });

    test('shows submitting state during submission', async () => {
      responseService.submitResponse.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      // Fill required fields
      const textInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(textInput, { target: { value: 'Test answer' } });
      
      const radioOption = screen.getByLabelText('Option 1');
      fireEvent.click(radioOption);
      
      const submitButton = screen.getByText('Submit Form');
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Submit Form')).toBeInTheDocument();
      });
    });

    test('filters out empty answers in submission', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      // Fill only required fields
      const textInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(textInput, { target: { value: 'Test answer' } });
      
      const radioOption = screen.getByLabelText('Option 1');
      fireEvent.click(radioOption);
      
      const submitButton = screen.getByText('Submit Form');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(responseService.submitResponse).toHaveBeenCalledWith(
          expect.objectContaining({
            answers: expect.arrayContaining([
              { questionId: 'q1', answer: 'Test answer' },
              { questionId: 'q3', answer: 'Option 1' }
            ])
          })
        );
      });
    });
  });

  describe('My Submissions Tab', () => {
    test('displays no submissions message when empty', async () => {
      responseService.getMySubmissions.mockResolvedValue([]);
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('My Submissions'));
      
      await waitFor(() => {
        expect(screen.getByText("You haven't submitted this form yet.")).toBeInTheDocument();
        expect(screen.getByText('Submit Now')).toBeInTheDocument();
      });
    });

    test('switches to submit tab when clicking Submit Now', async () => {
      responseService.getMySubmissions.mockResolvedValue([]);
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('My Submissions'));
      
      await waitFor(() => {
        expect(screen.getByText('Submit Now')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Submit Now'));
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });
    });

    test('navigates to submission view when clicking View Details', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('My Submissions'));
      
      await waitFor(() => {
        expect(screen.getByText('Submission #sub1')).toBeInTheDocument();
      });

      const viewButton = screen.getAllByText('View Details')[0];
      fireEvent.click(viewButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/submission/sub1/view');
    });
  });

  describe('Navigation', () => {
    test('navigates to dashboard on cancel', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Test Form')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/learner/dashboard');
    });
  });
});
