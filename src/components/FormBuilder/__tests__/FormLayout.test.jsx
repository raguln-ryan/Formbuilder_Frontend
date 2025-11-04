import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FormLayout from '../FormLayout';

// Mock child components
jest.mock('../SectionEditor', () => {
  return function SectionEditor({ questions, onQuestionsChange, formTitle, formDescription, formId }) {
    return (
      <div data-testid="section-editor">
        <div>Questions: {questions.length}</div>
        <button onClick={() => onQuestionsChange([...questions, { _id: 'new', question: 'New Question' }])}>
          Add Question
        </button>
      </div>
    );
  };
});

jest.mock('../FormPreview', () => {
  return function FormPreview({ questions, formTitle, formDescription }) {
    return (
      <div data-testid="form-preview">
        <h2>{formTitle}</h2>
        <p>{formDescription}</p>
        {questions.map(q => (
          <div key={q._id}>{q.question}</div>
        ))}
      </div>
    );
  };
});

describe('FormLayout Component', () => {
  const mockOnQuestionsChange = jest.fn();
  const mockOnSaveAsDraft = jest.fn();
  const mockOnPublish = jest.fn();
  
  const defaultProps = {
    formData: {
      title: 'Test Form',
      description: 'Test Description'
    },
    questions: [],
    onQuestionsChange: mockOnQuestionsChange,
    onSaveAsDraft: mockOnSaveAsDraft,
    onPublish: mockOnPublish,
    saving: false
  };

  beforeEach(() => {
    mockOnQuestionsChange.mockClear();
    mockOnSaveAsDraft.mockClear();
    mockOnPublish.mockClear();
  });

  describe('Rendering', () => {
    test('renders layout with action buttons', () => {
      render(<FormLayout {...defaultProps} />);
      
      expect(screen.getByText('Preview Form')).toBeInTheDocument();
      expect(screen.getByText('Save as Draft')).toBeInTheDocument();
      expect(screen.getByText('Publish Form')).toBeInTheDocument();
    });

    test('renders section editor', () => {
      render(<FormLayout {...defaultProps} />);
      
      expect(screen.getByTestId('section-editor')).toBeInTheDocument();
      expect(screen.getByText('Questions: 0')).toBeInTheDocument();
    });

    test('passes formData to section editor', () => {
      render(<FormLayout {...defaultProps} />);
      
      expect(screen.getByTestId('section-editor')).toBeInTheDocument();
    });
  });

  describe('Preview Modal', () => {
    test('opens preview modal on button click', () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Test Question' }]
      };

      render(<FormLayout {...props} />);
      
      const previewButton = screen.getByText('Preview Form');
      fireEvent.click(previewButton);
      
      expect(screen.getByText('Form Preview')).toBeInTheDocument();
      expect(screen.getByTestId('form-preview')).toBeInTheDocument();
    });

    test('displays form data in preview', () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question1' }]
      };

      render(<FormLayout {...props} />);
      
      fireEvent.click(screen.getByText('Preview Form'));
      
      expect(screen.getByText('Test Form')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Question 1')).toBeInTheDocument();
    });

    test('closes preview modal on close button click', () => {
      render(<FormLayout {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Preview Form'));
      expect(screen.getByText('Form Preview')).toBeInTheDocument();
      
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      
      expect(screen.queryByText('Form Preview')).not.toBeInTheDocument();
    });

    test('closes preview modal on backdrop click', () => {
      render(<FormLayout {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Preview Form'));
      expect(screen.getByText('Form Preview')).toBeInTheDocument();
      
      const backdrop = screen.getByTestId('modal-backdrop');
      fireEvent.click(backdrop);
      
      expect(screen.queryByText('Form Preview')).not.toBeInTheDocument();
    });
  });

  describe('Save Functionality', () => {
    test('calls onSaveAsDraft when save button clicked', () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question 1' }]
      };

      render(<FormLayout {...props} />);
      
      const saveButton = screen.getByText('Save as Draft');
      fireEvent.click(saveButton);
      
      expect(mockOnSaveAsDraft).toHaveBeenCalledTimes(1);
    });

    test('disables save button when no questions', () => {
      render(<FormLayout {...defaultProps} />);
      
      const saveButton = screen.getByText('Save as Draft');
      expect(saveButton).toBeDisabled();
    });

    test('enables save button when questions exist', () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question 1' }]
      };

      render(<FormLayout {...props} />);
      
      const saveButton = screen.getByText('Save as Draft');
      expect(saveButton).not.toBeDisabled();
    });

    test('shows saving state on save button', () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question 1' }],
        saving: true
      };

      render(<FormLayout {...props} />);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByText('Saving...')).toBeDisabled();
    });
  });

  describe('Publish Functionality', () => {
    test('opens publish confirmation modal', () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question 1' }]
      };

      render(<FormLayout {...props} />);
      
      const publishButton = screen.getByText('Publish Form');
      fireEvent.click(publishButton);
      
      expect(screen.getByText(/Are you sure you want to publish this form/)).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    test('calls onPublish when confirmed', () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question 1' }]
      };

      render(<FormLayout {...props} />);
      
      fireEvent.click(screen.getByText('Publish Form'));
      
      const confirmButton = screen.getAllByText('Publish Form')[1];
      fireEvent.click(confirmButton);
      
      expect(mockOnPublish).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(/Are you sure you want to publish/)).not.toBeInTheDocument();
    });

    test('closes modal on cancel', () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question 1' }]
      };

      render(<FormLayout {...props} />);
      
      fireEvent.click(screen.getByText('Publish Form'));
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockOnPublish).not.toHaveBeenCalled();
      expect(screen.queryByText(/Are you sure you want to publish/)).not.toBeInTheDocument();
    });

    test('disables publish button when no questions', () => {
      render(<FormLayout {...defaultProps} />);
      
      const publishButton = screen.getByText('Publish Form');
      expect(publishButton).toBeDisabled();
    });

    test('enables publish button when questions exist', () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question 1' }]
      };

      render(<FormLayout {...props} />);
      
      const publishButton = screen.getByText('Publish Form');
      expect(publishButton).not.toBeDisabled();
    });

    test('shows publishing state on publish button', () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question 1' }],
        saving: true
      };

      render(<FormLayout {...props} />);
      
      expect(screen.getByText('Publishing...')).toBeInTheDocument();
      expect(screen.getByText('Publishing...')).toBeDisabled();
    });
  });

  describe('Question Management', () => {
    test('updates questions through section editor', () => {
      render(<FormLayout {...defaultProps} />);
      
      const addButton = screen.getByText('Add Question');
      fireEvent.click(addButton);
      
      expect(mockOnQuestionsChange).toHaveBeenCalledWith([
        { _id: 'new', question: 'New Question' }
      ]);
    });

    test('passes questions to section editor', () => {
      const props = {
        ...defaultProps,
        questions: [
          { _id: '1', question: 'Question 1' },
          { _id: '2', question: 'Question 2' }
        ]
      };

      render(<FormLayout {...props} />);
      
      expect(screen.getByText('Questions: 2')).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    test('disables all action buttons during saving', () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question 1' }],
        saving: true
      };

      render(<FormLayout {...props} />);
      
      expect(screen.getByText('Preview Form')).toBeDisabled();
      expect(screen.getByText('Saving...')).toBeDisabled();
      expect(screen.getByText('Publishing...')).toBeDisabled();
    });

    test('disables save and publish when no questions', () => {
      render(<FormLayout {...defaultProps} />);
      
      expect(screen.getByText('Save as Draft')).toBeDisabled();
      expect(screen.getByText('Publish Form')).toBeDisabled();
      expect(screen.getByText('Preview Form')).not.toBeDisabled();
    });

    test('enables all buttons when questions exist and not saving', () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question 1' }],
        saving: false
      };

      render(<FormLayout {...props} />);
      
      expect(screen.getByText('Preview Form')).not.toBeDisabled();
      expect(screen.getByText('Save as Draft')).not.toBeDisabled();
      expect(screen.getByText('Publish Form')).not.toBeDisabled();
    });
  });

  describe('Form Data Display', () => {
    test('displays form title in header', () => {
      render(<FormLayout {...defaultProps} />);
      
      const header = screen.getByRole('heading', { level: 2 });
      expect(header).toHaveTextContent('Test Form');
    });

    test('displays form description', () => {
      render(<FormLayout {...defaultProps} />);
      
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    test('handles empty form title', () => {
      const props = {
        ...defaultProps,
        formData: {
          title: '',
          description: 'Test Description'
        }
      };

      render(<FormLayout {...props} />);
      
      expect(screen.getByText('Untitled Form')).toBeInTheDocument();
    });

    test('handles empty form description', () => {
      const props = {
        ...defaultProps,
        formData: {
          title: 'Test Form',
          description: ''
        }
      };

      render(<FormLayout {...props} />);
      
      expect(screen.getByText('No description provided')).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('opens preview with keyboard shortcut', () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question 1' }]
      };

      render(<FormLayout {...props} />);
      
      fireEvent.keyDown(document, { key: 'p', ctrlKey: true });
      
      expect(screen.getByText('Form Preview')).toBeInTheDocument();
    });

    test('saves with keyboard shortcut', () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question 1' }]
      };

      render(<FormLayout {...props} />);
      
      fireEvent.keyDown(document, { key: 's', ctrlKey: true });
      
      expect(mockOnSaveAsDraft).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Behavior', () => {
    test('adjusts layout for mobile view', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      
      render(<FormLayout {...defaultProps} />);
      
      const actionBar = screen.getByTestId('action-bar');
      expect(actionBar).toHaveClass('mobile');
    });

    test('adjusts layout for desktop view', () => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));
      
      render(<FormLayout {...defaultProps} />);
      
      const actionBar = screen.getByTestId('action-bar');
      expect(actionBar).toHaveClass('desktop');
    });
  });

  describe('Error Handling', () => {
    test('handles undefined formData gracefully', () => {
      const props = {
        ...defaultProps,
        formData: undefined
      };

      render(<FormLayout {...props} />);
      
      expect(screen.getByText('Untitled Form')).toBeInTheDocument();
      expect(screen.getByText('No description provided')).toBeInTheDocument();
    });

    test('handles null questions array', () => {
      const props = {
        ...defaultProps,
        questions: null
      };

      render(<FormLayout {...props} />);
      
      expect(screen.getByText('Questions: 0')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    test('shows loading indicator when fetching data', () => {
      const props = {
        ...defaultProps,
        loading: true
      };

      render(<FormLayout {...props} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('hides loading indicator when data loaded', () => {
      const props = {
        ...defaultProps,
        loading: false
      };

      render(<FormLayout {...props} />);
      
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Tooltips', () => {
    test('shows tooltip on preview button hover', async () => {
      render(<FormLayout {...defaultProps} />);
      
      const previewButton = screen.getByText('Preview Form');
      fireEvent.mouseEnter(previewButton);
      
      await screen.findByText('Preview how the form will appear to users');
    });

    test('shows tooltip on save button hover', async () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question 1' }]
      };

      render(<FormLayout {...props} />);
      
      const saveButton = screen.getByText('Save as Draft');
      fireEvent.mouseEnter(saveButton);
      
      await screen.findByText('Save current progress as draft');
    });

    test('shows tooltip on publish button hover', async () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question 1' }]
      };

      render(<FormLayout {...props} />);
      
      const publishButton = screen.getByText('Publish Form');
      fireEvent.mouseEnter(publishButton);
      
      await screen.findByText('Make the form available to users');
    });
  });

  describe('Auto-save', () => {
    test('auto-saves after inactivity period', () => {
      jest.useFakeTimers();
      
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question 1' }],
        autoSave: true
      };

      render(<FormLayout {...props} />);
      
      // Simulate inactivity
      jest.advanceTimersByTime(30000);
      
      expect(mockOnSaveAsDraft).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });

    test('shows auto-save indicator', () => {
      const props = {
        ...defaultProps,
        questions: [{ _id: '1', question: 'Question 1' }],
        autoSave: true,
        lastSaved: new Date().toISOString()
      };

      render(<FormLayout {...props} />);
      
      expect(screen.getByText(/Auto-saved/)).toBeInTheDocument();
    });
  });
});
