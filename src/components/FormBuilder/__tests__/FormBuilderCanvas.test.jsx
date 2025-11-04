import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormBuilderCanvas from '../FormBuilderCanvas';
import toast from 'react-hot-toast';

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

describe('FormBuilderCanvas Component', () => {
  const mockOnQuestionsChange = jest.fn();
  
  const defaultProps = {
    questions: [],
    onQuestionsChange: mockOnQuestionsChange,
    formTitle: 'Test Form',
    formDescription: 'Test Description'
  };

  beforeEach(() => {
    mockOnQuestionsChange.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
  });

  describe('Basic Rendering', () => {
    test('renders form title and description', () => {
      render(<FormBuilderCanvas {...defaultProps} />);
      
      expect(screen.getByText('Test Form')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    test('renders with empty title showing default', () => {
      render(<FormBuilderCanvas {...defaultProps} formTitle="" />);
      
      expect(screen.getByText('Untitled Form')).toBeInTheDocument();
    });

    test('renders with empty description showing default', () => {
      render(<FormBuilderCanvas {...defaultProps} formDescription="" />);
      
      expect(screen.getByText('No description available')).toBeInTheDocument();
    });

    test('shows empty state when no questions', () => {
      render(<FormBuilderCanvas {...defaultProps} />);
      
      expect(screen.getByText('Drag fields from the left panel')).toBeInTheDocument();
      expect(screen.getByAltText('drag icon')).toBeInTheDocument();
    });

    test('renders questions when provided', () => {
      const questions = [
        { _id: '1', type: 'short_text', question: 'Question 1', order: 0 },
        { _id: '2', type: 'number', question: 'Question 2', order: 1 }
      ];

      render(<FormBuilderCanvas {...defaultProps} questions={questions} />);
      
      expect(screen.getByDisplayValue('Question 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Question 2')).toBeInTheDocument();
    });

    test('applies disabled class with formId', () => {
      const { container } = render(
        <FormBuilderCanvas {...defaultProps} formId="123" />
      );
      
      expect(container.querySelector('.form-builder-canvas')).toHaveClass('disabled');
    });
  });

  describe('Drag and Drop Operations', () => {
    test('handles dragover event', () => {
      const { container } = render(<FormBuilderCanvas {...defaultProps} />);
      
      const dropZone = container.querySelector('.drop-zone');
      const event = new Event('dragover', { bubbles: true });
      event.preventDefault = jest.fn();
      event.dataTransfer = { dropEffect: '' };
      
      fireEvent(dropZone, event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.dataTransfer.dropEffect).toBe('copy');
      expect(dropZone).toHaveClass('dragging');
    });

    test('handles dragleave event', () => {
      const { container } = render(<FormBuilderCanvas {...defaultProps} />);
      
      const dropZone = container.querySelector('.drop-zone');
      
      // First trigger dragover to add dragging class
      fireEvent.dragOver(dropZone);
      expect(dropZone).toHaveClass('dragging');
      
      fireEvent.dragLeave(dropZone);
      expect(dropZone).not.toHaveClass('dragging');
    });

    test('drops short_text field successfully', () => {
      const { container } = render(<FormBuilderCanvas {...defaultProps} />);
      
      const dropZone = container.querySelector('.drop-zone');
      const fieldData = { type: 'short_text', label: 'Short Text' };
      
      const event = new Event('drop', { bubbles: true });
      event.preventDefault = jest.fn();
      event.dataTransfer = { 
        getData: jest.fn(() => JSON.stringify(fieldData))
      };
      
      fireEvent(dropZone, event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOnQuestionsChange).toHaveBeenCalled();
      
      const newQuestion = mockOnQuestionsChange.mock.calls[0][0][0];
      expect(newQuestion.type).toBe('short_text');
      expect(newQuestion.question).toBe('Short Text');
      expect(toast.success).toHaveBeenCalledWith('Short Text field added successfully!', expect.any(Object));
    });

    test('drops long_text field with default properties', () => {
      const { container } = render(<FormBuilderCanvas {...defaultProps} />);
      
      const dropZone = container.querySelector('.drop-zone');
      const fieldData = { type: 'long_text', label: 'Long Text' };
      
      const event = new Event('drop', { bubbles: true });
      event.preventDefault = jest.fn();
      event.dataTransfer = { 
        getData: jest.fn(() => JSON.stringify(fieldData))
      };
      
      fireEvent(dropZone, event);
      
      const newQuestion = mockOnQuestionsChange.mock.calls[0][0][0];
      expect(newQuestion.type).toBe('long_text');
      expect(newQuestion.rows).toBe(4);
    });

    test('drops number field with validation', () => {
      const { container } = render(<FormBuilderCanvas {...defaultProps} />);
      
      const dropZone = container.querySelector('.drop-zone');
      const fieldData = { type: 'number', label: 'Number' };
      
      const event = new Event('drop', { bubbles: true });
      event.dataTransfer = { 
        getData: jest.fn(() => JSON.stringify(fieldData))
      };
      event.preventDefault = jest.fn();
      
      fireEvent(dropZone, event);
      
      const newQuestion = mockOnQuestionsChange.mock.calls[0][0][0];
      expect(newQuestion.type).toBe('number');
    });

    test('drops choice field with options', () => {
      const { container } = render(<FormBuilderCanvas {...defaultProps} />);
      
      const dropZone = container.querySelector('.drop-zone');
      const fieldData = { type: 'choice', label: 'Multiple Choice' };
      
      const event = new Event('drop', { bubbles: true });
      event.dataTransfer = { 
        getData: jest.fn(() => JSON.stringify(fieldData))
      };
      event.preventDefault = jest.fn();
      
      fireEvent(dropZone, event);
      
      const newQuestion = mockOnQuestionsChange.mock.calls[0][0][0];
      expect(newQuestion.type).toBe('choice');
      expect(newQuestion.options).toHaveLength(2);
      expect(newQuestion.options[0].value).toBe('Option 1');
    });

    test('drops date_picker field', () => {
      const { container } = render(<FormBuilderCanvas {...defaultProps} />);
      
      const dropZone = container.querySelector('.drop-zone');
      const fieldData = { type: 'date_picker', label: 'Date Picker' };
      
      const event = new Event('drop', { bubbles: true });
      event.dataTransfer = { 
        getData: jest.fn(() => JSON.stringify(fieldData))
      };
      event.preventDefault = jest.fn();
      
      fireEvent(dropZone, event);
      
      const newQuestion = mockOnQuestionsChange.mock.calls[0][0][0];
      expect(newQuestion.type).toBe('date_picker');
      expect(newQuestion.format).toBe('MM/DD/YYYY');
    });

    test('handles invalid JSON in drop', () => {
      const { container } = render(<FormBuilderCanvas {...defaultProps} />);
      
      const dropZone = container.querySelector('.drop-zone');
      
      const event = new Event('drop', { bubbles: true });
      event.dataTransfer = { 
        getData: jest.fn(() => 'invalid json')
      };
      event.preventDefault = jest.fn();
      
      fireEvent(dropZone, event);
      
      expect(toast.error).toHaveBeenCalledWith('Failed to add field. Please try again.');
    });

    test('handles empty data transfer', () => {
      const { container } = render(<FormBuilderCanvas {...defaultProps} />);
      
      const dropZone = container.querySelector('.drop-zone');
      
      const event = new Event('drop', { bubbles: true });
      event.dataTransfer = { 
        getData: jest.fn(() => '')
      };
      event.preventDefault = jest.fn();
      
      fireEvent(dropZone, event);
      
      expect(mockOnQuestionsChange).not.toHaveBeenCalled();
    });

    test('adds field to existing questions', () => {
      const existingQuestions = [
        { _id: '1', type: 'short_text', question: 'Existing', order: 0 }
      ];

      const { container } = render(
        <FormBuilderCanvas {...defaultProps} questions={existingQuestions} />
      );
      
      const dropZone = container.querySelector('.drop-zone');
      const fieldData = { type: 'number', label: 'New Number' };
      
      const event = new Event('drop', { bubbles: true });
      event.dataTransfer = { 
        getData: jest.fn(() => JSON.stringify(fieldData))
      };
      event.preventDefault = jest.fn();
      
      fireEvent(dropZone, event);
      
      const updatedQuestions = mockOnQuestionsChange.mock.calls[0][0];
      expect(updatedQuestions).toHaveLength(2);
      expect(updatedQuestions[1].order).toBe(1);
    });
  });

  describe('Question Management', () => {
    test('updates question text', () => {
      const questions = [
        { _id: '1', type: 'short_text', question: 'Original', order: 0 }
      ];

      render(<FormBuilderCanvas {...defaultProps} questions={questions} />);
      
      const input = screen.getByDisplayValue('Original');
      fireEvent.change(input, { target: { value: 'Updated Question' } });
      
      expect(mockOnQuestionsChange).toHaveBeenCalledWith([
        expect.objectContaining({ question: 'Updated Question' })
      ]);
    });

    test('deletes question', () => {
      const questions = [
        { _id: '1', type: 'short_text', question: 'Q1', order: 0 },
        { _id: '2', type: 'number', question: 'Q2', order: 1 }
      ];

      render(<FormBuilderCanvas {...defaultProps} questions={questions} />);
      
      const deleteButtons = screen.getAllByTitle('Delete Question');
      fireEvent.click(deleteButtons[0]);
      
      const updatedQuestions = mockOnQuestionsChange.mock.calls[0][0];
      expect(updatedQuestions).toHaveLength(1);
      expect(updatedQuestions[0]._id).toBe('2');
      expect(updatedQuestions[0].order).toBe(0);
      expect(toast.success).toHaveBeenCalledWith('Question deleted', expect.any(Object));
    });

    test('duplicates question', () => {
      const questions = [
        { _id: '1', type: 'short_text', question: 'Original', order: 0 }
      ];

      render(<FormBuilderCanvas {...defaultProps} questions={questions} />);
      
      const duplicateButton = screen.getByTitle('Duplicate Question');
      fireEvent.click(duplicateButton);
      
      const updatedQuestions = mockOnQuestionsChange.mock.calls[0][0];
      expect(updatedQuestions).toHaveLength(2);
      expect(updatedQuestions[1].question).toBe('Original (Copy)');
      expect(toast.success).toHaveBeenCalledWith('Question duplicated successfully!', expect.any(Object));
    });

    test('toggles required field', () => {
      const questions = [
        { _id: '1', type: 'short_text', question: 'Q1', required: false, order: 0 }
      ];

      render(<FormBuilderCanvas {...defaultProps} questions={questions} />);
      
      const checkbox = screen.getByRole('checkbox', { name: /required/i });
      fireEvent.click(checkbox);
      
      expect(mockOnQuestionsChange).toHaveBeenCalledWith([
        expect.objectContaining({ required: true })
      ]);
    });

    test('adds option to choice question', () => {
      const questions = [
        { 
          _id: '1', 
          type: 'choice', 
          question: 'Choice', 
          options: [{ id: '1', value: 'Option 1' }],
          order: 0 
        }
      ];

      render(<FormBuilderCanvas {...defaultProps} questions={questions} />);
      
      const addButton = screen.getByText('Add Option');
      fireEvent.click(addButton);
      
      const updatedQuestion = mockOnQuestionsChange.mock.calls[0][0][0];
      expect(updatedQuestion.options).toHaveLength(2);
    });

    test('updates option text', () => {
      const questions = [
        { 
          _id: '1', 
          type: 'choice', 
          question: 'Choice', 
          options: [{ id: '1', value: 'Option 1' }],
          order: 0 
        }
      ];

      render(<FormBuilderCanvas {...defaultProps} questions={questions} />);
      
      const optionInput = screen.getByDisplayValue('Option 1');
      fireEvent.change(optionInput, { target: { value: 'Updated Option' } });
      
      const updatedQuestion = mockOnQuestionsChange.mock.calls[0][0][0];
      expect(updatedQuestion.options[0].value).toBe('Updated Option');
    });

    test('removes option from choice question', () => {
      const questions = [
        { 
          _id: '1', 
          type: 'choice', 
          question: 'Choice', 
          options: [
            { id: '1', value: 'Option 1' },
            { id: '2', value: 'Option 2' }
          ],
          order: 0 
        }
      ];

      render(<FormBuilderCanvas {...defaultProps} questions={questions} />);
      
      const removeButtons = screen.getAllByTitle('Remove Option');
      fireEvent.click(removeButtons[0]);
      
      const updatedQuestion = mockOnQuestionsChange.mock.calls[0][0][0];
      expect(updatedQuestion.options).toHaveLength(1);
      expect(updatedQuestion.options[0].value).toBe('Option 2');
    });
  });

  describe('Empty State', () => {
    test('applies empty class when no questions', () => {
      const { container } = render(<FormBuilderCanvas {...defaultProps} />);
      
      const dropZone = container.querySelector('.drop-zone');
      expect(dropZone).toHaveClass('empty');
    });

    test('removes empty class when questions exist', () => {
      const questions = [
        { _id: '1', type: 'short_text', question: 'Q1', order: 0 }
      ];

      const { container } = render(
        <FormBuilderCanvas {...defaultProps} questions={questions} />
      );
      
      const dropZone = container.querySelector('.drop-zone');
      expect(dropZone).not.toHaveClass('empty');
    });
  });

  describe('Edge Cases', () => {
    test('handles question without _id', () => {
      const questions = [
        { type: 'short_text', question: 'No ID', order: 0 }
      ];

      render(<FormBuilderCanvas {...defaultProps} questions={questions} />);
      
      expect(screen.getByDisplayValue('No ID')).toBeInTheDocument();
    });

    test('handles special characters in question text', () => {
      const questions = [
        { _id: '1', type: 'short_text', question: 'Q&A <test>', order: 0 }
      ];

      render(<FormBuilderCanvas {...defaultProps} questions={questions} />);
      
      const input = screen.getByDisplayValue('Q&A <test>');
      fireEvent.change(input, { target: { value: 'New & "Special" <Characters>' } });
      
      const updatedQuestion = mockOnQuestionsChange.mock.calls[0][0][0];
      expect(updatedQuestion.question).toBe('New & "Special" <Characters>');
    });

    test('handles rapid operations', () => {
      const questions = [
        { _id: '1', type: 'short_text', question: 'Q1', order: 0 }
      ];

      render(<FormBuilderCanvas {...defaultProps} questions={questions} />);
      
      const duplicateButton = screen.getByTitle('Duplicate Question');
      
      // Rapid clicks
      fireEvent.click(duplicateButton);
      fireEvent.click(duplicateButton);
      
      // Should handle all clicks
      expect(mockOnQuestionsChange).toHaveBeenCalledTimes(2);
    });
  });
});
