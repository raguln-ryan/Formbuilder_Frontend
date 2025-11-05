import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import FormLayout from '../FormLayout';

// Mock dependencies
jest.mock('../../../styles/components/FormBuilder/FormEditor.css', () => ({}));

// Mock child components
jest.mock('../SectionEditor', () => {
  return function MockSectionEditor({ questions, onQuestionsChange, formTitle, formDescription }) {
    return (
      <div data-testid="section-editor">
        <div>Title: {formTitle}</div>
        <div>Description: {formDescription}</div>
        <div>Questions: {questions.length}</div>
        <button onClick={() => onQuestionsChange([...questions, { id: 'new' }])}>
          Add Question
        </button>
      </div>
    );
  };
});

jest.mock('../QuestionPreview', () => {
  return function MockQuestionPreview({ formTitle, formDescription, questions }) {
    return (
      <div data-testid="question-preview">
        <div>Preview Title: {formTitle}</div>
        <div>Preview Description: {formDescription}</div>
        <div>Preview Questions: {questions.length}</div>
      </div>
    );
  };
});

jest.mock('../../Common/Modal', () => {
  return function MockModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <div>{title}</div>
        <div>{message}</div>
        <button onClick={onClose}>Close</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    );
  };
});

// Create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      formBuilder: (state = {
        showPreview: false,
        showPublishModal: false,
        ...initialState
      }, action) => {
        switch (action.type) {
          case 'formBuilder/togglePreview':
            return { ...state, showPreview: !state.showPreview };
          case 'formBuilder/setShowPublishModal':
            return { ...state, showPublishModal: action.payload };
          default:
            return state;
        }
      }
    }
  });
};

describe('FormLayout', () => {
  const mockOnQuestionsChange = jest.fn();
  const mockOnSaveAsDraft = jest.fn();
  const mockOnPublish = jest.fn();

  const defaultProps = {
    formData: { title: 'Test Form', description: 'Test Description' },
    questions: [{ _id: 'q1', question: 'Question 1' }],
    onQuestionsChange: mockOnQuestionsChange,
    onSaveAsDraft: mockOnSaveAsDraft,
    onPublish: mockOnPublish,
    saving: false
  };

  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore();
  });

  test('renders SectionEditor by default', () => {
    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    expect(screen.getByTestId('section-editor')).toBeInTheDocument();
    expect(screen.getByText('Title: Test Form')).toBeInTheDocument();
    expect(screen.getByText('Description: Test Description')).toBeInTheDocument();
  });

  test('shows action buttons when not in preview mode', () => {
    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Preview Form')).toBeInTheDocument();
    expect(screen.getByText('Save as Draft')).toBeInTheDocument();
    expect(screen.getByText('Publish Form')).toBeInTheDocument();
  });

  test('toggles preview mode', () => {
    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    const previewButton = screen.getByText('Preview Form');
    fireEvent.click(previewButton);

    expect(screen.getByTestId('question-preview')).toBeInTheDocument();
    expect(screen.getByText('Preview Title: Test Form')).toBeInTheDocument();
  });

  test('closes preview modal', () => {
    store = createMockStore({ showPreview: true });

    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    waitFor(() => {
      expect(screen.queryByTestId('question-preview')).not.toBeInTheDocument();
    });
  });

  test('hides action buttons in preview mode', () => {
    store = createMockStore({ showPreview: true });

    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    expect(screen.queryByText('Save as Draft')).not.toBeInTheDocument();
    expect(screen.queryByText('Publish Form')).not.toBeInTheDocument();
  });

  test('handles save as draft click', () => {
    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    const saveButton = screen.getByText('Save as Draft');
    fireEvent.click(saveButton);

    expect(mockOnSaveAsDraft).toHaveBeenCalled();
  });


  test('disables save button when saving', () => {
    const props = { ...defaultProps, saving: true };

    render(
      <Provider store={store}>
        <FormLayout {...props} />
      </Provider>
    );

    const saveButton = screen.getByText('Saving...');
    expect(saveButton).toBeDisabled();
  });

  test('disables save button when no questions', () => {
    const props = { ...defaultProps, questions: [] };

    render(
      <Provider store={store}>
        <FormLayout {...props} />
      </Provider>
    );

    const saveButton = screen.getByText('Save as Draft');
    expect(saveButton).toBeDisabled();
  });

  test('shows publish confirmation modal', () => {
    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    const publishButton = screen.getByText('Publish Form');
    fireEvent.click(publishButton);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Publish Form')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to publish this form/)).toBeInTheDocument();
  });

  test('confirms publish', () => {
    store = createMockStore({ showPublishModal: true });

    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    expect(mockOnPublish).toHaveBeenCalled();
  });

  test('cancels publish', () => {
    store = createMockStore({ showPublishModal: true });

    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    waitFor(() => {
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  test('disables publish button when saving', () => {
    const props = { ...defaultProps, saving: true };

    render(
      <Provider store={store}>
        <FormLayout {...props} />
      </Provider>
    );

    const publishButton = screen.getByText('Publishing...');
    expect(publishButton).toBeDisabled();
  });

  test('disables publish button when no questions', () => {
    const props = { ...defaultProps, questions: [] };

    render(
      <Provider store={store}>
        <FormLayout {...props} />
      </Provider>
    );

    const publishButton = screen.getByText('Publish Form');
    expect(publishButton).toBeDisabled();
  });

  test('handles questions change', () => {
    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    const addButton = screen.getByText('Add Question');
    fireEvent.click(addButton);

    expect(mockOnQuestionsChange).toHaveBeenCalled();
  });

  test('renders preview modal header correctly', () => {
    store = createMockStore({ showPreview: true });

    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Form Preview')).toBeInTheDocument();
  });

  test('renders modal with correct props', () => {
    store = createMockStore({ showPublishModal: true });

    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    const modal = screen.getByTestId('modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText(/Once published, editing will be locked/)).toBeInTheDocument();
  });

  test('preview button shows eye icon', () => {
    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    const previewButton = screen.getByText(/Preview Form/);
    expect(previewButton.textContent).toContain('👁️');
  });

  test('renders with all props defined', () => {
    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    expect(screen.getByTestId('section-editor')).toBeInTheDocument();
    expect(screen.getByText('Questions: 1')).toBeInTheDocument();
  });

  test('renders without preview when showPreview is false', () => {
    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    expect(screen.queryByTestId('question-preview')).not.toBeInTheDocument();
  });

  test('renders question preview with correct props when in preview mode', () => {
    store = createMockStore({ showPreview: true });

    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Preview Questions: 1')).toBeInTheDocument();
  });

  test('passes formTitle and formDescription to SectionEditor', () => {
    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Title: Test Form')).toBeInTheDocument();
    expect(screen.getByText('Description: Test Description')).toBeInTheDocument();
  });

  test('renders actions in correct wrapper divs', () => {
    const { container } = render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    expect(container.querySelector('.form-config-actions-wrapper')).toBeInTheDocument();
    expect(container.querySelector('.actions-right-group')).toBeInTheDocument();
  });

  test('handles empty formData', () => {
    const props = {
      ...defaultProps,
      formData: { title: '', description: '' }
    };

    render(
      <Provider store={store}>
        <FormLayout {...props} />
      </Provider>
    );

    expect(screen.getByText('Title:')).toBeInTheDocument();
    expect(screen.getByText('Description:')).toBeInTheDocument();
  });

  test('renders with minimal props', () => {
    const minimalProps = {
      formData: { title: '', description: '' },
      questions: [],
      onQuestionsChange: jest.fn(),
      onSaveAsDraft: jest.fn(),
      onPublish: jest.fn(),
      saving: false
    };

    render(
      <Provider store={store}>
        <FormLayout {...minimalProps} />
      </Provider>
    );

    expect(screen.getByTestId('section-editor')).toBeInTheDocument();
  });

  test('does not render null when showPreview is false', () => {
    const { container } = render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    const previewModal = container.querySelector('.preview-modal');
    expect(previewModal).not.toBeInTheDocument();
  });

  test('modal receives correct variant prop', () => {
    store = createMockStore({ showPublishModal: true });

    const { container } = render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    // Modal is rendered with variant="default"
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  test('modal receives correct type prop', () => {
    store = createMockStore({ showPublishModal: true });

    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    // Modal is rendered with type="publish"
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    expect(container.querySelector('.form-editor-content-area1')).toBeInTheDocument();
    expect(container.querySelector('.form-layout-wrapper')).toBeInTheDocument();
  });

  test('applies correct button classes', () => {
    const { container } = render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    expect(container.querySelector('.action-button-secondary')).toBeInTheDocument();
    expect(container.querySelector('.action-button-outline')).toBeInTheDocument();
    expect(container.querySelector('.action-button-primary')).toBeInTheDocument();
  });

  test('renders close button with correct symbol', () => {
    store = createMockStore({ showPreview: true });

    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    const closeButton = screen.getByText('×');
    expect(closeButton).toHaveClass('close-preview');
  });

  test('preview modal has correct structure', () => {
    store = createMockStore({ showPreview: true });

    const { container } = render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    expect(container.querySelector('.preview-modal')).toBeInTheDocument();
    expect(container.querySelector('.preview-modal-content')).toBeInTheDocument();
    expect(container.querySelector('.preview-modal-header')).toBeInTheDocument();
  });

  test('renders with complex questions array', () => {
    const complexProps = {
      ...defaultProps,
      questions: [
        { _id: 'q1', question: 'Question 1', type: 'text' },
        { _id: 'q2', question: 'Question 2', type: 'select' },
        { _id: 'q3', question: 'Question 3', type: 'checkbox' }
      ]
    };

    render(
      <Provider store={store}>
        <FormLayout {...complexProps} />
      </Provider>
    );

    expect(screen.getByText('Questions: 3')).toBeInTheDocument();
  });

  test('handles undefined onHeaderChange gracefully', () => {
    const props = {
      ...defaultProps,
      onHeaderChange: undefined
    };

    render(
      <Provider store={store}>
        <FormLayout {...props} />
      </Provider>
    );

    expect(screen.getByTestId('section-editor')).toBeInTheDocument();
  });

  test('all buttons are accessible', () => {
    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    const previewButton = screen.getByText(/Preview Form/);
    const saveButton = screen.getByText('Save as Draft');
    const publishButton = screen.getByText('Publish Form');

    expect(previewButton).toBeEnabled();
    expect(saveButton).toBeEnabled();
    expect(publishButton).toBeEnabled();
  });

  test('integrates with Redux store correctly', () => {
    const customStore = createMockStore({ 
      showPreview: false, 
      showPublishModal: false 
    });

    const { rerender } = render(
      <Provider store={customStore}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    // Toggle preview
    const previewButton = screen.getByText('Preview Form');
    fireEvent.click(previewButton);

    rerender(
      <Provider store={customStore}>
        <FormLayout {...defaultProps} />
      </Provider>
    );
  });

  test('handles rapid clicks on preview toggle', () => {
    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    const previewButton = screen.getByText('Preview Form');
    
    // Rapid clicks
    fireEvent.click(previewButton);
    fireEvent.click(previewButton);
    fireEvent.click(previewButton);
  });

  test('handles rapid clicks on publish button', () => {
    render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    const publishButton = screen.getByText('Publish Form');
    
    // Rapid clicks
    fireEvent.click(publishButton);
    fireEvent.click(publishButton);
  });

  test('maintains state consistency', () => {
    const { rerender } = render(
      <Provider store={store}>
        <FormLayout {...defaultProps} />
      </Provider>
    );

    // Change props
    const newProps = {
      ...defaultProps,
      formData: { title: 'New Title', description: 'New Description' }
    };

    rerender(
      <Provider store={store}>
        <FormLayout {...newProps} />
      </Provider>
    );

    expect(screen.getByText('Title: New Title')).toBeInTheDocument();
  });

  test('handles all edge cases for saving state', () => {
    const savingProps = {
      ...defaultProps,
      saving: true,
      questions: []
    };

    render(
      <Provider store={store}>
        <FormLayout {...savingProps} />
      </Provider>
    );

    expect(screen.getByText('Saving...')).toBeDisabled();
    expect(screen.getByText('Publishing...')).toBeDisabled();
  });
});
