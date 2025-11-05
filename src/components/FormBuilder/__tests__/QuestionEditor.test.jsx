import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionEditor from '../QuestionEditor';

// Mock dependencies
jest.mock('../../../styles/components/FormBuilder/QuestionEditor.css', () => ({}));
jest.mock('../../../assets/elements.png', () => 'elements');
jest.mock('../../../assets/TrashBin.png', () => 'trashbin');
jest.mock('../../../assets/Threedot.png', () => 'threedot');
jest.mock('../../../assets/file.png', () => 'file');

// Mock Input component
jest.mock('../../Common/Input', () => {
  return function MockInput({ value, onChange, placeholder, label, type, required, rows }) {
    if (type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          required={required}
          data-testid="textarea-input"
        />
      );
    }
    return (
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        data-testid={label ? `input-${label}` : 'input'}
      />
    );
  };
});

// Mock Button component
jest.mock('../../Common/Button', () => {
  return function MockButton({ children, onClick, size }) {
    return (
      <button onClick={onClick} className={`btn-${size}`}>
        {children}
      </button>
    );
  };
});

describe('QuestionEditor', () => {
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnMove = jest.fn();
  const mockOnDuplicate = jest.fn();
  const mockOnDragStart = jest.fn();
  const mockOnDragEnd = jest.fn();
  const mockOnDragOver = jest.fn();
  const mockOnDrop = jest.fn();

  const defaultProps = {
    question: {
      _id: 'q1',
      type: 'short_text',
      question: 'Test Question',
      description: 'Test Description',
      description_enabled: false,
      required: false,
      options: []
    },
    index: 0,
    totalQuestions: 3,
    isEditing: false,
    onUpdate: mockOnUpdate,
    onDelete: mockOnDelete,
    onMove: mockOnMove,
    onDuplicate: mockOnDuplicate,
    onDragStart: mockOnDragStart,
    onDragEnd: mockOnDragEnd,
    onDragOver: mockOnDragOver,
    onDrop: mockOnDrop,
    isDragging: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders display mode by default', () => {
    render(<QuestionEditor {...defaultProps} />);
    
    expect(screen.getByText('Test Question')).toBeInTheDocument();
    expect(screen.getByText('Short Text (Up to 100 Characters)')).toBeInTheDocument();
  });

  test('renders edit mode when isEditing is true', () => {
    const props = { ...defaultProps, isEditing: true };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByPlaceholderText('Add short text title')).toBeInTheDocument();
    expect(screen.getByText('Question Type')).toBeInTheDocument();
  });

  test('updates local question when prop changes', () => {
    const { rerender } = render(<QuestionEditor {...defaultProps} />);
    
    const updatedQuestion = {
      ...defaultProps.question,
      question: 'Updated Question'
    };
    
    rerender(<QuestionEditor {...defaultProps} question={updatedQuestion} />);
    
    expect(screen.getByText('Updated Question')).toBeInTheDocument();
  });

  test('handles field change', () => {
    const props = { ...defaultProps, isEditing: true };
    
    render(<QuestionEditor {...props} />);
    
    const input = screen.getByPlaceholderText('Add short text title');
    fireEvent.change(input, { target: { value: 'New Question' } });
    
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...defaultProps.question,
      question: 'New Question'
    });
  });

  test('handles description toggle', () => {
    const props = { ...defaultProps, isEditing: true };
    
    render(<QuestionEditor {...props} />);
    
    const descriptionToggle = screen.getByText('Description').nextElementSibling;
    fireEvent.click(descriptionToggle);
    
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...defaultProps.question,
      description_enabled: true
    });
  });

  test('shows description input when enabled', () => {
    const props = {
      ...defaultProps,
      question: { ...defaultProps.question, description_enabled: true },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByPlaceholderText('Add helpful text for this question')).toBeInTheDocument();
  });

  test('handles required toggle', () => {
    const props = { ...defaultProps, isEditing: true };
    
    render(<QuestionEditor {...props} />);
    
    const requiredToggle = screen.getByText('Required').nextElementSibling;
    fireEvent.click(requiredToggle);
    
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...defaultProps.question,
      required: true
    });
  });

  test('handles delete click', () => {
    const props = { ...defaultProps, isEditing: true };
    
    render(<QuestionEditor {...props} />);
    
    const deleteButton = screen.getByTitle('Delete Question');
    const event = { stopPropagation: jest.fn() };
    
    fireEvent.click(deleteButton, event);
    
    expect(mockOnDelete).toHaveBeenCalled();
  });

  test('handles duplicate click', () => {
    const props = { ...defaultProps, isEditing: true };
    
    render(<QuestionEditor {...props} />);
    
    const duplicateButton = screen.getByTitle('Duplicate Question');
    const event = { stopPropagation: jest.fn() };
    
    fireEvent.click(duplicateButton, event);
    
    expect(mockOnDuplicate).toHaveBeenCalledWith(
      expect.objectContaining({
        question: 'Test Question (Copy)'
      })
    );
  });

  test('renders choice question with options', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'choice',
        options: [
          { _id: 'opt1', value: 'Option 1' },
          { _id: 'opt2', value: 'Option 2' }
        ]
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByText('Answer Options')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Option 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Option 2')).toBeInTheDocument();
  });

  test('handles add option for choice question', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'choice',
        options: []
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    const addButton = screen.getByText('+ Add Option');
    fireEvent.click(addButton);
    
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [expect.objectContaining({ value: 'Option 1' })]
      })
    );
  });

  test('handles option change', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'choice',
        options: [
          { _id: 'opt1', value: 'Option 1' },
          { _id: 'opt2', value: 'Option 2' }
        ]
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    const optionInput = screen.getByDisplayValue('Option 1');
    fireEvent.change(optionInput, { target: { value: 'Updated Option' } });
    
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          { _id: 'opt1', value: 'Updated Option' },
          { _id: 'opt2', value: 'Option 2' }
        ]
      })
    );
  });

  test('handles remove option', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'choice',
        options: [
          { _id: 'opt1', value: 'Option 1' },
          { _id: 'opt2', value: 'Option 2' },
          { _id: 'opt3', value: 'Option 3' }
        ]
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    const removeButtons = screen.getAllByTitle('Remove option');
    fireEvent.click(removeButtons[0]);
    
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          { _id: 'opt2', value: 'Option 2' },
          { _id: 'opt3', value: 'Option 3' }
        ]
      })
    );
  });

  test('disables remove option when only 2 options remain', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'choice',
        options: [
          { _id: 'opt1', value: 'Option 1' },
          { _id: 'opt2', value: 'Option 2' }
        ]
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    const removeButtons = screen.getAllByTitle('Remove option');
    expect(removeButtons[0]).toBeDisabled();
    expect(removeButtons[1]).toBeDisabled();
  });

  test('does not remove option when only 2 remain', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'choice',
        options: [
          { _id: 'opt1', value: 'Option 1' },
          { _id: 'opt2', value: 'Option 2' }
        ]
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    const removeButtons = screen.getAllByTitle('Remove option');
    fireEvent.click(removeButtons[0]);
    
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  test('renders date picker question', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'date_picker',
        date_format: 'DD/MM/YYYY'
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByText('Date Format:')).toBeInTheDocument();
    expect(screen.getByLabelText('DD/MM/YYYY')).toBeChecked();
  });

  test('handles date format change', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'date_picker'
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    const ddmmFormat = screen.getByLabelText('DD-MM-YYYY');
    fireEvent.click(ddmmFormat);
    
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        date_format: 'DD-MM-YYYY'
      })
    );
  });

  test('renders file upload question', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'file_upload'
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByText('Supported files: PDF, PNG, JPG')).toBeInTheDocument();
    expect(screen.getByText('Max file size: 2 MB')).toBeInTheDocument();
  });

  test('renders dropdown question with single select', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'choice',
        multiple_choice: false
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    const singleSelect = screen.getByLabelText('Single Select');
    expect(singleSelect).toBeChecked();
  });

  test('handles selection type change to multiple', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'choice',
        multiple_choice: false
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    const multiSelect = screen.getByLabelText('Multi Select');
    fireEvent.click(multiSelect);
    
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        single_choice: false,
        multiple_choice: true
      })
    );
  });

  test('handles selection type change to single', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'choice',
        multiple_choice: true
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    const singleSelect = screen.getByLabelText('Single Select');
    fireEvent.click(singleSelect);
    
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        single_choice: true,
        multiple_choice: false
      })
    );
  });

  test('handles drag start', () => {
    const props = { ...defaultProps, isEditing: true };
    
    render(<QuestionEditor {...props} />);
    
    const dragHandle = screen.getByTitle('Drag to reorder');
    
    const event = new Event('dragstart', { bubbles: true });
    event.stopPropagation = jest.fn();
    event.dataTransfer = {
      effectAllowed: null,
      setData: jest.fn()
    };
    event.target = {
      innerHTML: 'test',
      closest: jest.fn(() => ({ classList: { add: jest.fn() } }))
    };
    
    Object.defineProperty(event, 'target', {
      value: {
        innerHTML: 'test',
        closest: jest.fn(() => ({ classList: { add: jest.fn() } }))
      },
      writable: true
    });
    
    fireEvent(dragHandle, event);
    
    expect(mockOnDragStart).toHaveBeenCalledWith(0);
  });

  test('handles drag over', () => {
    render(<QuestionEditor {...defaultProps} />);
    
    const event = new Event('dragover', { bubbles: true });
    event.preventDefault = jest.fn();
    event.stopPropagation = jest.fn();
    
    const questionEditor = screen.getByText('Test Question').closest('.question-editor');
    fireEvent(questionEditor, event);
    
    expect(mockOnDragOver).toHaveBeenCalledWith(event, 0);
  });

  test('handles drop', () => {
    render(<QuestionEditor {...defaultProps} />);
    
    const event = new Event('drop', { bubbles: true });
    event.preventDefault = jest.fn();
    event.stopPropagation = jest.fn();
    
    const questionEditor = screen.getByText('Test Question').closest('.question-editor');
    fireEvent(questionEditor, event);
    
    expect(mockOnDrop).toHaveBeenCalledWith(event, 0);
  });

  test('handles drag end', () => {
    const props = { ...defaultProps, isEditing: true };
    
    render(<QuestionEditor {...props} />);
    
    const dragHandle = screen.getByTitle('Drag to reorder');
    
    const event = new Event('dragend', { bubbles: true });
    event.preventDefault = jest.fn();
    event.target = {
      closest: jest.fn(() => ({ classList: { remove: jest.fn() } }))
    };
    
    Object.defineProperty(event, 'target', {
      value: {
        closest: jest.fn(() => ({ classList: { remove: jest.fn() } }))
      },
      writable: true
    });
    
    fireEvent(dragHandle, event);
    
    expect(mockOnDragEnd).toHaveBeenCalled();
  });

  test('applies dragging class', () => {
    const props = { ...defaultProps, isDragging: true };
    
    const { container } = render(<QuestionEditor {...props} />);
    
    expect(container.querySelector('.question-editor')).toHaveClass('dragging');
  });

  test('renders long text question', () => {
    const props = {
      ...defaultProps,
      question: { ...defaultProps.question, type: 'long_text' }
    };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByText('Long Text (Up to 500 Characters)')).toBeInTheDocument();
  });

  test('renders number question', () => {
    const props = {
      ...defaultProps,
      question: { ...defaultProps.question, type: 'number' }
    };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByText('Numeric Value')).toBeInTheDocument();
  });

  test('renders placeholder when question title is empty', () => {
    const props = {
      ...defaultProps,
      question: { ...defaultProps.question, question: '' }
    };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByText('Click here to add short text title')).toBeInTheDocument();
  });

  test('renders description in display mode when enabled', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        description_enabled: true,
        description: 'This is a description'
      }
    };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByText('This is a description')).toBeInTheDocument();
  });

  test('displays options in display mode for choice question', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'choice',
        options: [
          { _id: 'opt1', value: 'Display Option 1' },
          { _id: 'opt2', value: 'Display Option 2' }
        ]
      }
    };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByText('Display Option 1')).toBeInTheDocument();
    expect(screen.getByText('Display Option 2')).toBeInTheDocument();
  });

  test('displays date format in display mode', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'date_picker',
        date_format: 'DD-MM-YYYY'
      }
    };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByText('DD-MM-YYYY')).toBeInTheDocument();
  });

  test('displays file upload in display mode', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'file_upload'
      }
    };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByText('File Upload (Only one file allowed)')).toBeInTheDocument();
    expect(screen.getByText('Supported files: PDF, PNG, JPG | Max file size 2 MB')).toBeInTheDocument();
  });

  test('handles duplicate with options', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'choice',
        options: [
          { _id: 'opt1', value: 'Option 1' },
          { _id: 'opt2', value: 'Option 2' }
        ]
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    const duplicateButton = screen.getByTitle('Duplicate Question');
    fireEvent.click(duplicateButton);
    
    const duplicatedQuestion = mockOnDuplicate.mock.calls[0][0];
    expect(duplicatedQuestion.options).toHaveLength(2);
    expect(duplicatedQuestion.options[0]._id).not.toBe('opt1');
  });

  test('handles undefined options for choice question', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'choice',
        options: undefined
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    const addButton = screen.getByText('+ Add Option');
    fireEvent.click(addButton);
    
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [expect.objectContaining({ value: 'Option 1' })]
      })
    );
  });

  test('handles date picker with default format', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'date_picker',
        date_format: undefined
      }
    };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByText('DD/MM/YYYY')).toBeInTheDocument();
  });

  test('stops event propagation on element click in edit mode', () => {
    const props = { ...defaultProps, isEditing: true };
    
    render(<QuestionEditor {...props} />);
    
    const questionBody = screen.getByPlaceholderText('Add short text title').closest('.question-body');
    
    const event = { stopPropagation: jest.fn() };
    fireEvent.click(questionBody, event);
    
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  test('applies correct CSS classes', () => {
    const props = { ...defaultProps, isEditing: true };
    
    const { container } = render(<QuestionEditor {...props} />);
    
    expect(container.querySelector('.question-editor')).toHaveClass('expanded', 'editing');
  });

  test('renders collapsed class when not editing', () => {
    const { container } = render(<QuestionEditor {...defaultProps} />);
    
    expect(container.querySelector('.question-editor')).toHaveClass('collapsed');
    expect(container.querySelector('.question-editor')).not.toHave
    expect(container.querySelector('.question-editor')).not.toHaveClass('expanded', 'editing');
  });

  test('renders with null options array', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'choice',
        options: null
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    const addButton = screen.getByText('+ Add Option');
    expect(addButton).toBeInTheDocument();
  });

  test('handles edge case with default date format checked state', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'date_picker',
        date_format: null
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    const defaultFormat = screen.getByLabelText('DD/MM/YYYY');
    expect(defaultFormat).toBeChecked();
  });

  test('handles description change', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        description_enabled: true,
        description: ''
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    const descriptionInput = screen.getByPlaceholderText('Add helpful text for this question');
    fireEvent.change(descriptionInput, { target: { value: 'New description text' } });
    
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'New description text'
      })
    );
  });

  test('renders unknown question type', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'unknown_type'
      }
    };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByText('unknown_type')).toBeInTheDocument();
  });

  test('handles option with missing _id', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'choice',
        options: [
          { value: 'Option 1' },
          { value: 'Option 2' }
        ]
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByDisplayValue('Option 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Option 2')).toBeInTheDocument();
  });

  test('displays default date format when not specified', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'date_picker'
      }
    };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByText('DD/MM/YYYY')).toBeInTheDocument();
  });

  test('handles option index-based keys', () => {
    const props = {
      ...defaultProps,
      question: {
        ...defaultProps.question,
        type: 'choice',
        options: [
          { _id: null, value: 'Option 1' },
          { _id: undefined, value: 'Option 2' }
        ]
      },
      isEditing: true
    };
    
    render(<QuestionEditor {...props} />);
    
    expect(screen.getByDisplayValue('Option 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Option 2')).toBeInTheDocument();
  });
});
