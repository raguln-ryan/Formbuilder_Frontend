import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FormBuilderCanvas from '../FormBuilderCanvas';
import toast from 'react-hot-toast';
import { generateId } from '../../../utils/helpers';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('../../../utils/helpers', () => ({
  generateId: jest.fn(() => 'generated-id')
}));
jest.mock('../../../styles/components/FormBuilder/FormBuilderCanvas.css', () => ({}));
jest.mock('./../../../assets/drag.png', () => 'drag.png');

// Mock QuestionEditor
jest.mock('../QuestionEditor', () => {
  return function MockQuestionEditor({ 
    question, 
    index, 
    onUpdate, 
    onDelete, 
    onMove, 
    onDuplicate,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    isEditing 
  }) {
    return (
      <div 
        data-testid={`question-${index}`}
        draggable
        onDragStart={() => onDragStart(index)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOver(e, index)}
        onDrop={(e) => onDrop(e, index)}
        className={isEditing ? 'editing' : ''}
      >
        <div>Question {index + 1}</div>
        <button onClick={() => onUpdate({ ...question, updated: true })}>Update</button>
        <button onClick={() => onDelete()}>Delete</button>
        <button onClick={() => onMove('up')}>Move Up</button>
        <button onClick={() => onMove('down')}>Move Down</button>
        <button onClick={() => onDuplicate(question)}>Duplicate</button>
      </div>
    );
  };
});

describe('FormBuilderCanvas', () => {
  const mockOnQuestionsChange = jest.fn();
  const mockOnHeaderChange = jest.fn();

  const defaultProps = {
    questions: [],
    onQuestionsChange: mockOnQuestionsChange,
    formTitle: 'Test Form',
    formDescription: 'Test Description',
    onHeaderChange: mockOnHeaderChange
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders empty state when no questions', () => {
    render(<FormBuilderCanvas {...defaultProps} />);
    
    expect(screen.getByText('Drag fields from the left panel')).toBeInTheDocument();
    expect(screen.getByAltText('drag icon')).toBeInTheDocument();
  });

  test('renders questions when provided', () => {
    const props = {
      ...defaultProps,
      questions: [
        { _id: 'q1', question: 'Question 1' },
        { _id: 'q2', question: 'Question 2' }
      ]
    };

    render(<FormBuilderCanvas {...props} />);
    
    expect(screen.getByTestId('question-0')).toBeInTheDocument();
    expect(screen.getByTestId('question-1')).toBeInTheDocument();
  });

  test('renders header section', () => {
    render(<FormBuilderCanvas {...defaultProps} />);
    
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Test Form')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  test('shows placeholder text when no title or description', () => {
    const props = {
      ...defaultProps,
      formTitle: '',
      formDescription: ''
    };

    render(<FormBuilderCanvas {...props} />);
    
    expect(screen.getByText('Click to add form title')).toBeInTheDocument();
    expect(screen.getByText('Click to add form description')).toBeInTheDocument();
  });

  test('handles header click to enter edit mode', () => {
    render(<FormBuilderCanvas {...defaultProps} />);
    
    const headerCard = screen.getByText('Test Form').closest('.form-header-card');
    fireEvent.click(headerCard);
    
    expect(screen.getByPlaceholderText('Enter form title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter form description')).toBeInTheDocument();
  });

  test('handles header title change', () => {
    render(<FormBuilderCanvas {...defaultProps} />);
    
    const headerCard = screen.getByText('Test Form').closest('.form-header-card');
    fireEvent.click(headerCard);
    
    const titleInput = screen.getByPlaceholderText('Enter form title');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    
    expect(titleInput.value).toBe('New Title');
  });

  test('handles header description change', () => {
    render(<FormBuilderCanvas {...defaultProps} />);
    
    const headerCard = screen.getByText('Test Form').closest('.form-header-card');
    fireEvent.click(headerCard);
    
    const descInput = screen.getByPlaceholderText('Enter form description');
    fireEvent.change(descInput, { target: { value: 'New Description' } });
    
    expect(descInput.value).toBe('New Description');
  });

  test('handles click outside header to save changes', () => {
    const { container } = render(<FormBuilderCanvas {...defaultProps} />);
    
    const headerCard = screen.getByText('Test Form').closest('.form-header-card');
    fireEvent.click(headerCard);
    
    const titleInput = screen.getByPlaceholderText('Enter form title');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    
    // Click outside
    fireEvent.mouseDown(container.firstChild);
    
    expect(mockOnHeaderChange).toHaveBeenCalledWith({
      title: 'New Title',
      description: 'Test Description'
    });
  });

  test('does not edit header in view mode', () => {
    const props = {
      ...defaultProps,
      formId: 'existing-form-id'
    };

    render(<FormBuilderCanvas {...props} />);
    
    const headerCard = screen.getByText('Test Form').closest('.form-header-card');
    fireEvent.click(headerCard);
    
    expect(screen.queryByPlaceholderText('Enter form title')).not.toBeInTheDocument();
  });

  test('handles drag start from sidebar', () => {
    const dataTransfer = {
      types: { includes: jest.fn(() => true) }
    };

    const { container } = render(<FormBuilderCanvas {...defaultProps} />);
    
    const dragEvent = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragEvent, 'dataTransfer', { value: dataTransfer });
    
    document.dispatchEvent(dragEvent);
  });

  test('handles drag over', () => {
    const dataTransfer = {
      types: { includes: jest.fn(() => true) },
      dropEffect: null
    };

    render(<FormBuilderCanvas {...defaultProps} />);
    
    const dropSection = screen.getByText('Drag fields from the left panel').closest('.drag-drop-section');
    
    const dragOverEvent = new Event('dragover', { bubbles: true });
    Object.defineProperty(dragOverEvent, 'dataTransfer', { value: dataTransfer });
    
    fireEvent(dropSection, dragOverEvent);
  });

  test('handles drag enter', () => {
    const dataTransfer = {
      types: { includes: jest.fn(() => true) }
    };

    render(<FormBuilderCanvas {...defaultProps} />);
    
    const dropSection = screen.getByText('Drag fields from the left panel').closest('.drag-drop-section');
    
    const dragEnterEvent = new Event('dragenter', { bubbles: true });
    Object.defineProperty(dragEnterEvent, 'dataTransfer', { value: dataTransfer });
    
    fireEvent(dropSection, dragEnterEvent);
  });

  test('handles drag leave', () => {
    const { container } = render(<FormBuilderCanvas {...defaultProps} />);
    
    const dropSection = container.querySelector('.drag-drop-section');
    const rect = {
      left: 0,
      right: 100,
      top: 0,
      bottom: 100
    };
    
    jest.spyOn(dropSection, 'getBoundingClientRect').mockReturnValue(rect);
    
    const dragLeaveEvent = new Event('dragleave', { bubbles: true });
    Object.defineProperty(dragLeaveEvent, 'clientX', { value: 150 });
    Object.defineProperty(dragLeaveEvent, 'clientY', { value: 150 });
    
    fireEvent(dropSection, dragLeaveEvent);
  });

  test('handles drag leave within bounds', () => {
    const { container } = render(<FormBuilderCanvas {...defaultProps} />);
    
    const dropSection = container.querySelector('.drag-drop-section');
    const rect = {
      left: 0,
      right: 100,
      top: 0,
      bottom: 100
    };
    
    jest.spyOn(dropSection, 'getBoundingClientRect').mockReturnValue(rect);
    
    const dragLeaveEvent = new Event('dragleave', { bubbles: true });
    Object.defineProperty(dragLeaveEvent, 'clientX', { value: 50 });
    Object.defineProperty(dragLeaveEvent, 'clientY', { value: 50 });
    
    fireEvent(dropSection, dragLeaveEvent);
  });

  test('handles drop with choice field type', () => {
    const fieldData = {
      type: 'choice',
      label: 'Choice Field'
    };

    render(<FormBuilderCanvas {...defaultProps} />);
    
    const dropSection = screen.getByText('Drag fields from the left panel').closest('.drag-drop-section');
    
    const dropEvent = new Event('drop', { bubbles: true });
    dropEvent.preventDefault = jest.fn();
    dropEvent.stopPropagation = jest.fn();
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        getData: jest.fn(() => JSON.stringify(fieldData))
      }
    });
    
    fireEvent(dropSection, dropEvent);
    
    expect(mockOnQuestionsChange).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      'Choice Field field added successfully!',
      expect.any(Object)
    );
  });

  test('handles drop with date_picker field type', () => {
    const fieldData = {
      type: 'date_picker',
      label: 'Date Picker'
    };

    render(<FormBuilderCanvas {...defaultProps} />);
    
    const dropSection = screen.getByText('Drag fields from the left panel').closest('.drag-drop-section');
    
    const dropEvent = new Event('drop', { bubbles: true });
    dropEvent.preventDefault = jest.fn();
    dropEvent.stopPropagation = jest.fn();
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        getData: jest.fn(() => JSON.stringify(fieldData))
      }
    });
    
    fireEvent(dropSection, dropEvent);
    
    const callArg = mockOnQuestionsChange.mock.calls[0][0];
    expect(callArg[0].format).toBe('MM/DD/YYYY');
  });

  test('handles drop with regular field type', () => {
    const fieldData = {
      type: 'text',
      label: 'Text Field'
    };

    render(<FormBuilderCanvas {...defaultProps} />);
    
    const dropSection = screen.getByText('Drag fields from the left panel').closest('.drag-drop-section');
    
    const dropEvent = new Event('drop', { bubbles: true });
    dropEvent.preventDefault = jest.fn();
    dropEvent.stopPropagation = jest.fn();
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        getData: jest.fn(() => JSON.stringify(fieldData))
      }
    });
    
    fireEvent(dropSection, dropEvent);
    
    const callArg = mockOnQuestionsChange.mock.calls[0][0];
    expect(callArg[0].options).toEqual([]);
  });

  test('handles drop with no data', () => {
    render(<FormBuilderCanvas {...defaultProps} />);
    
    const dropSection = screen.getByText('Drag fields from the left panel').closest('.drag-drop-section');
    
    const dropEvent = new Event('drop', { bubbles: true });
    dropEvent.preventDefault = jest.fn();
    dropEvent.stopPropagation = jest.fn();
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        getData: jest.fn(() => null)
      }
    });
    
    fireEvent(dropSection, dropEvent);
    
    expect(mockOnQuestionsChange).not.toHaveBeenCalled();
  });

  test('handles drop error', () => {
    render(<FormBuilderCanvas {...defaultProps} />);
    
    const dropSection = screen.getByText('Drag fields from the left panel').closest('.drag-drop-section');
    
    const dropEvent = new Event('drop', { bubbles: true });
    dropEvent.preventDefault = jest.fn();
    dropEvent.stopPropagation = jest.fn();
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        getData: jest.fn(() => 'invalid json')
      }
    });
    
    fireEvent(dropSection, dropEvent);
    
    expect(toast.error).toHaveBeenCalledWith('Failed to add field. Please try again.');
  });

  test('handles question update', () => {
    const props = {
      ...defaultProps,
      questions: [{ _id: 'q1', question: 'Question 1' }]
    };

    render(<FormBuilderCanvas {...props} />);
    
    const updateButton = screen.getByText('Update');
    fireEvent.click(updateButton);
    
    expect(mockOnQuestionsChange).toHaveBeenCalledWith([
      { _id: 'q1', question: 'Question 1', updated: true }
    ]);
  });

  test('handles question delete', () => {
    const props = {
      ...defaultProps,
      questions: [
        { _id: 'q1', question: 'Question 1' },
        { _id: 'q2', question: 'Question 2' }
      ]
    };

    render(<FormBuilderCanvas {...props} />);
    
    const deleteButton = screen.getAllByText('Delete')[0];
    fireEvent.click(deleteButton);
    
    expect(mockOnQuestionsChange).toHaveBeenCalledWith([
      { _id: 'q2', question: 'Question 2', order: 0 }
    ]);
    expect(toast.success).toHaveBeenCalledWith('Question deleted', { duration: 3000 });
  });

  test('handles move up', () => {
    const props = {
      ...defaultProps,
      questions: [
        { _id: 'q1', question: 'Question 1' },
        { _id: 'q2', question: 'Question 2' }
      ]
    };

    render(<FormBuilderCanvas {...props} />);
    
    const moveUpButton = screen.getAllByText('Move Up')[1];
    fireEvent.click(moveUpButton);
    
    expect(mockOnQuestionsChange).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      'Question moved up',
      expect.objectContaining({ icon: '⬆️' })
    );
  });

  test('handles move down', () => {
    const props = {
      ...defaultProps,
      questions: [
        { _id: 'q1', question: 'Question 1' },
        { _id: 'q2', question: 'Question 2' }
      ]
    };

    render(<FormBuilderCanvas {...props} />);
    
    const moveDownButton = screen.getAllByText('Move Down')[0];
    fireEvent.click(moveDownButton);
    
    expect(mockOnQuestionsChange).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      'Question moved down',
      expect.objectContaining({ icon: '⬇️' })
    );
  });

  test('handles move up at first position', () => {
    const props = {
      ...defaultProps,
      questions: [{ _id: 'q1', question: 'Question 1' }]
    };

    render(<FormBuilderCanvas {...props} />);
    
    const moveUpButton = screen.getByText('Move Up');
    fireEvent.click(moveUpButton);
    
    expect(toast.error).toHaveBeenCalledWith('Cannot move question up', { duration: 2000 });
  });

  test('handles move down at last position', () => {
    const props = {
      ...defaultProps,
      questions: [{ _id: 'q1', question: 'Question 1' }]
    };

    render(<FormBuilderCanvas {...props} />);
    
    const moveDownButton = screen.getByText('Move Down');
    fireEvent.click(moveDownButton);
    
    expect(toast.error).toHaveBeenCalledWith('Cannot move question down', { duration: 2000 });
  });

  test('handles question duplicate', () => {
    const props = {
      ...defaultProps,
      questions: [{ _id: 'q1', question: 'Question 1' }]
    };

    render(<FormBuilderCanvas {...props} />);
    
    const duplicateButton = screen.getByText('Duplicate');
    fireEvent.click(duplicateButton);
    
    expect(mockOnQuestionsChange).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      'Question duplicated successfully!',
      { duration: 2000 }
    );
  });

  test('handles question drag start', () => {
    const props = {
      ...defaultProps,
      questions: [{ _id: 'q1', question: 'Question 1' }]
    };

    render(<FormBuilderCanvas {...props} />);
    
    const question = screen.getByTestId('question-0');
    fireEvent.dragStart(question);
  });

  test('handles question drag over', () => {
    const props = {
      ...defaultProps,
      questions: [
        { _id: 'q1', question: 'Question 1' },
        { _id: 'q2', question: 'Question 2' }
      ]
    };

    render(<FormBuilderCanvas {...props} />);
    
    const question1 = screen.getByTestId('question-0');
    const question2 = screen.getByTestId('question-1');
    
    fireEvent.dragStart(question1);
    
    const dragOverEvent = new Event('dragover', { bubbles: true });
    dragOverEvent.preventDefault = jest.fn();
    
    fireEvent(question2, dragOverEvent);
  });

  test('handles question drop for reordering', () => {
    const props = {
      ...defaultProps,
      questions: [
        { _id: 'q1', question: 'Question 1' },
        { _id: 'q2', question: 'Question 2' }
      ]
    };

    render(<FormBuilderCanvas {...props} />);
    
    const question1 = screen.getByTestId('question-0');
    const question2 = screen.getByTestId('question-1');
    
    fireEvent.dragStart(question1);
    
    const dropEvent = new Event('drop', { bubbles: true });
    dropEvent.preventDefault = jest.fn();
    dropEvent.stopPropagation = jest.fn();
    
    fireEvent(question2, dropEvent);
    
    expect(mockOnQuestionsChange).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      'Question reordered',
      expect.objectContaining({ icon: '↕️' })
    );
  });

  test('handles question drop at same position', () => {
    const props = {
      ...defaultProps,
      questions: [{ _id: 'q1', question: 'Question 1' }]
    };

    render(<FormBuilderCanvas {...props} />);
    
    const question = screen.getByTestId('question-0');
    
    fireEvent.dragStart(question);
    
    const dropEvent = new Event('drop', { bubbles: true });
    dropEvent.preventDefault = jest.fn();
    dropEvent.stopPropagation = jest.fn();
    
    fireEvent(question, dropEvent);
    
    expect(mockOnQuestionsChange).not.toHaveBeenCalled();
  });

  test('handles question drag end', () => {
    const props = {
      ...defaultProps,
      questions: [{ _id: 'q1', question: 'Question 1' }]
    };

    render(<FormBuilderCanvas {...props} />);
    
    const question = screen.getByTestId('question-0');
    fireEvent.dragEnd(question);
  });

  test('toggles question edit mode', () => {
    const props = {
      ...defaultProps,
      questions: [{ _id: 'q1', question: 'Question 1' }]
    };

    const { container } = render(<FormBuilderCanvas {...props} />);
    
    const questionDiv = container.querySelector('[data-testid="question-0"]').parentElement;
    fireEvent.click(questionDiv);
    
    expect(screen.getByTestId('question-0')).toHaveClass('editing');
    
    fireEvent.click(questionDiv);
    
    expect(screen.getByTestId('question-0')).not.toHaveClass('editing');
  });

  test('does not allow editing in view mode', () => {
    const props = {
      ...defaultProps,
      formId: 'existing-form-id',
      questions: [{ _id: 'q1', question: 'Question 1' }]
    };

    const { container } = render(<FormBuilderCanvas {...props} />);
    
    const questionDiv = container.querySelector('[data-testid="question-0"]').parentElement;
    fireEvent.click(questionDiv);
    
    expect(screen.getByTestId('question-0')).not.toHaveClass('editing');
  });

  test('handles click outside question to close edit mode', () => {
    const props = {
      ...defaultProps,
      questions: [{ _id: 'q1', question: 'Question 1' }]
    };

    const { container } = render(<FormBuilderCanvas {...props} />);
    
    const questionDiv = container.querySelector('[data-testid="question-0"]').parentElement;
    fireEvent.click(questionDiv);
    
    expect(screen.getByTestId('question-0')).toHaveClass('editing');
    
    fireEvent.mouseDown(container);
    
    expect(screen.getByTestId('question-0')).not.toHaveClass('editing');
  });

  test('shows drop placeholder when dragging from sidebar', () => {
    const props = {
      ...defaultProps,
      questions: [{ _id: 'q1', question: 'Question 1' }]
    };

    render(<FormBuilderCanvas {...props} />);
    
    // Simulate drag start from sidebar
    const dragStartEvent = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragStartEvent, 'dataTransfer', {
      value: { types: { includes: jest.fn(() => true) } }
    });
    document.dispatchEvent(dragStartEvent);
    
    // Simulate drag over
    const dropSection = document.querySelector('.drag-drop-section');
    const dragOverEvent = new Event('dragover', { bubbles: true });
    dragOverEvent.preventDefault = jest.fn();
    Object.defineProperty(dragOverEvent, 'dataTransfer', {
      value: { 
        dropEffect: null,
        types: { includes: jest.fn(() => true) }
      }
    });
    
    fireEvent(dropSection, dragOverEvent);
    
    // Wait for state update
    waitFor(() => {
      expect(screen.getByText('Drag and drop the item here')).toBeInTheDocument();
    });
  });

  test('handles global drag end event', () => {
    render(<FormBuilderCanvas {...defaultProps} />);
    
    const dragEndEvent = new Event('dragend', { bubbles: true });
    document.dispatchEvent(dragEndEvent);
  });

  test('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    const { unmount } = render(<FormBuilderCanvas {...defaultProps} />);
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('dragstart', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('dragend', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
  });

  test('renders with disabled class when formId is provided', () => {
    const props = {
      ...defaultProps,
      formId: 'existing-form-id'
    };

    const { container } = render(<FormBuilderCanvas {...props} />);
    
    expect(container.querySelector('.form-builder-canvas')).toHaveClass('disabled');
  });

  test('handles header save without onHeaderChange', () => {
    const props = {
      ...defaultProps,
      onHeaderChange: undefined
    };

    const { container } = render(<FormBuilderCanvas {...props} />);
    
    const headerCard = screen.getByText('Test Form').closest('.form-header-card');
    fireEvent.click(headerCard);
    
    fireEvent.mouseDown(container.firstChild);
  });

  test('handles drag over without dragged item', () => {
    render(<FormBuilderCanvas {...defaultProps} />);
    
    const dropSection = screen.getByText('Drag fields from the left panel').closest('.drag-drop-section');
    
    const dragOverEvent = new Event('dragover', { bubbles: true });
    dragOverEvent.preventDefault = jest.fn();
    Object.defineProperty(dragOverEvent, 'dataTransfer', {
      value: { dropEffect: null }
    });
    
    fireEvent(dropSection, dragOverEvent);
  });

  test('handles question drop without dragged index', () => {
    const props = {
      ...defaultProps,
      questions: [{ _id: 'q1', question: 'Question 1' }]
    };

    render(<FormBuilderCanvas {...props} />);
    
    const question = screen.getByTestId('question-0');
    
    const dropEvent = new Event('drop', { bubbles: true });
    dropEvent.preventDefault = jest.fn();
    dropEvent.stopPropagation = jest.fn();
    
    fireEvent(question, dropEvent);
    
    expect(mockOnQuestionsChange).not.toHaveBeenCalled();
  });

  test('removes drag-over class after drop', () => {
    const props = {
      ...defaultProps,
      questions: [
        { _id: 'q1', question: 'Question 1' },
        { _id: 'q2', question: 'Question 2' }
      ]
    };

    render(<FormBuilderCanvas {...props} />);
    
    const question1 = screen.getByTestId('question-0');
    const question2 = screen.getByTestId('question-1');
    
    question2.classList.add('drag-over');
    
    fireEvent.dragStart(question1);
    
    const dropEvent = new Event('drop', { bubbles: true });
    dropEvent.preventDefault = jest.fn();
    dropEvent.stopPropagation = jest.fn();
    
    fireEvent(question2, dropEvent);
    
    expect(question2).not.toHaveClass('drag-over');
  });

  test('cleans up drag-over classes on drag end', () => {
    const props = {
      ...defaultProps,
      questions: [{ _id: 'q1', question: 'Question 1' }]
    };

    render(<FormBuilderCanvas {...props} />);
    
    const question = screen.getByTestId('question-0');
    question.classList.add('drag-over');
    
    fireEvent.dragEnd(question);
    
    expect(question).not.toHaveClass('drag-over');
  });

  test('handles empty drop placeholder when dragging from sidebar with no questions', () => {
    render(<FormBuilderCanvas {...defaultProps} />);
    
    // Simulate drag start from sidebar
    const dragStartEvent = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragStartEvent, 'dataTransfer', {
      value: { types: { includes: jest.fn(() => true) } }
    });
    document.dispatchEvent(dragStartEvent);
    
    // Simulate drag over
    const dropSection = document.querySelector('.drag-drop-section');
    const dragOverEvent = new Event('dragover', { bubbles: true });
    dragOverEvent.preventDefault = jest.fn();
    Object.defineProperty(dragOverEvent, 'dataTransfer', {
      value: { 
        dropEffect: null,
        types: { includes: jest.fn(() => true) }
      }
    });
    
    fireEvent(dropSection, dragOverEvent);
  });
});
