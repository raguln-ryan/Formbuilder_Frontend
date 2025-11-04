import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionEditor from '../QuestionEditor';

describe('QuestionEditor Component', () => {
  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnMove = jest.fn();
  const mockOnDuplicate = jest.fn();
  const mockOnDragStart = jest.fn();
  const mockOnDragEnd = jest.fn();
  const mockOnDragOver = jest.fn();
  const mockOnDrop = jest.fn();

  const defaultQuestion = {
    _id: '1',
    type: 'short_text',
    question: 'Test Question',
    description_enabled: false,
    description: '',
    required: false,
    options: []
  };

  const defaultProps = {
    question: defaultQuestion,
    index: 0,
    totalQuestions: 1,
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

  test('renders question editor with basic fields', () => {
    render(<QuestionEditor {...defaultProps} />);
    
    expect(screen.getByDisplayValue('Test Question')).toBeInTheDocument();
    expect(screen.getByText('Question Type')).toBeInTheDocument();
    expect(screen.getByAltText('Drag to reorder')).toBeInTheDocument();
  });

  test('handles question text change', () => {
    render(<QuestionEditor {...defaultProps} />);
    
    const input = screen.getByDisplayValue('Test Question');
    fireEvent.change(input, { target: { value: 'Updated Question' } });
    
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        question: 'Updated Question'
      })
    );
  });

  test('renders date picker options', () => {
    const dateQuestion = {
      ...defaultQuestion,
      type: 'date_picker',
      date_format: 'DD/MM/YYYY'
    };
    
    render(<QuestionEditor {...defaultProps} question={dateQuestion} />);
    
    expect(screen.getByText('Date Format:')).toBeInTheDocument();
    expect(screen.getByLabelText('DD/MM/YYYY')).toBeChecked();
    expect(screen.getByLabelText('DD-MM-YYYY')).not.toBeChecked();
  });

  test('handles date format change', () => {
    const dateQuestion = {
      ...defaultQuestion,
      type: 'date_picker',
      date_format: 'DD/MM/YYYY'
    };
    
    render(<QuestionEditor {...defaultProps} question={dateQuestion} />);
    
    const formatRadio = screen.getByLabelText('DD-MM-YYYY');
    fireEvent.click(formatRadio);
    
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        date_format: 'DD-MM-YYYY'
      })
    );
  });

  test('renders dropdown selection type options', () => {
    const choiceQuestion = {
      ...defaultQuestion,
      type: 'choice',
      multiple_choice: false,
      single_choice: true,
      options: [
        { _id: 'opt1', value: 'Option 1' },
        { _id: 'opt2', value: 'Option 2' }
      ]
    };
    
    render(<QuestionEditor {...defaultProps} question={choiceQuestion} />);
    
    expect(screen.getByText('Selection Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Single Select')).toBeChecked();
    expect(screen.getByLabelText('Multi Select')).not.toBeChecked();
  });

  test('handles selection type change to multiple', () => {
    const choiceQuestion = {
      ...defaultQuestion,
      type: 'choice',
      multiple_choice: false,
      single_choice: true,
      options: []
    };
    
    render(<QuestionEditor {...defaultProps} question={choiceQuestion} />);
    
    const multiRadio = screen.getByLabelText('Multi Select');
    fireEvent.click(multiRadio);
    
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        single_choice: false,
        multiple_choice: true
      })
    );
  });

  test('renders file upload configuration', () => {
    const fileQuestion = {
      ...defaultQuestion,
      type: 'file_upload'
    };
    
    render(<QuestionEditor {...defaultProps} question={fileQuestion} />);
    
    expect(screen.getByText('Supported files: PDF, PNG, JPG')).toBeInTheDocument();
    expect(screen.getByText('Max file size: 2 MB')).toBeInTheDocument();
  });

  test('renders and manages choice options', () => {
    const choiceQuestion = {
      ...defaultQuestion,
      type: 'choice',
      options: [
        { _id: 'opt1', value: 'Option 1' },
        { _id: 'opt2', value: 'Option 2' }
      ]
    };
    
    render(<QuestionEditor {...defaultProps} question={choiceQuestion} />);
    
    expect(screen.getByDisplayValue('Option 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Option 2')).toBeInTheDocument();
    expect(screen.getByText('+ Add Option')).toBeInTheDocument();
  });

  test('handles add option for choice question', () => {
    const choiceQuestion = {
      ...defaultQuestion,
      type: 'choice',
      options: [
        { _id: 'opt1', value: 'Option 1' },
        { _id: 'opt2', value: 'Option 2' }
      ]
    };
    
    render(<QuestionEditor {...defaultProps} question={choiceQuestion} />);
    
    const addButton = screen.getByText('+ Add Option');
    fireEvent.click(addButton);
    
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: 'Option 1' }),
          expect.objectContaining({ value: 'Option 2' }),
          expect.objectContaining({ value: 'Option 3' })
        ])
      })
    );
  });

  test('handles option text change', () => {
    const choiceQuestion = {
      ...defaultQuestion,
      type: 'choice',
      options: [
        { _id: 'opt1', value: 'Option 1' },
        { _id: 'opt2', value: 'Option 2' }
      ]
    };
    
    render(<QuestionEditor {...defaultProps} question={choiceQuestion} />);
    
    const optionInput = screen.getByDisplayValue('Option 1');
    fireEvent.change(optionInput, { target: { value: 'Updated Option' } });
    
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: 'Updated Option' }),
          expect.objectContaining({ value: 'Option 2' })
        ])
      })
    );
  });

  test('handles remove option when more than 2 options', () => {
    const choiceQuestion = {
      ...defaultQuestion,
      type: 'choice',
      options: [
        { _id: 'opt1', value: 'Option 1' },
        { _id: 'opt2', value: 'Option 2' },
        { _id: 'opt3', value: 'Option 3' }
      ]
    };
    
    render(<QuestionEditor {...defaultProps} question={choiceQuestion} />);
    
    const removeButtons = screen.getAllByTitle('Remove option');
    fireEvent.click(removeButtons[0]);
    
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: 'Option 2' }),
          expect.objectContaining({ value: 'Option 3' })
        ])
      })
    );
  });

  test('disables remove option when only 2 options remain', () => {
    const choiceQuestion = {
      ...defaultQuestion,
      type: 'choice',
      options: [
        { _id: 'opt1', value: 'Option 1' },
        { _id: 'opt2', value: 'Option 2' }
      ]
    };
    
    render(<QuestionEditor {...defaultProps} question={choiceQuestion} />);
    
    const removeButtons = screen.getAllByTitle('Remove option');
    expect(removeButtons[0]).toBeDisabled();
    expect(removeButtons[1]).toBeDisabled();
  });

 

  test('shows description textarea when enabled', () => {
    const questionWithDesc = {
      ...defaultQuestion,
      description_enabled: true,
      description: 'Test description'
    };
    
    render(<QuestionEditor {...defaultProps} question={questionWithDesc} />);
    
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
  });

  

  test('handles duplicate question', () => {
    render(<QuestionEditor {...defaultProps} />);
    
    const duplicateButton = screen.getByTitle('Duplicate Question');
    fireEvent.click(duplicateButton);
    
    expect(mockOnDuplicate).toHaveBeenCalledWith(
      expect.objectContaining({
        question: 'Test Question (Copy)'
      })
    );
  });

  test('handles delete question', () => {
    render(<QuestionEditor {...defaultProps} />);
    
    const deleteButton = screen.getByTitle('Delete Question');
    fireEvent.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalled();
  });

  test('handles drag start', () => {
    render(<QuestionEditor {...defaultProps} />);
    
    const dragHandle = screen.getByTitle('Drag to reorder');
    
    const dataTransfer = {
      effectAllowed: '',
      setData: jest.fn()
    };
    
    fireEvent.dragStart(dragHandle, { dataTransfer });
    
    expect(mockOnDragStart).toHaveBeenCalledWith(0);
    expect(dataTransfer.effectAllowed).toBe('move');
  });


  test('handles drag end', () => {
    render(<QuestionEditor {...defaultProps} />);
    
    const dragHandle = screen.getByTitle('Drag to reorder');
    fireEvent.dragEnd(dragHandle);
    
    expect(mockOnDragEnd).toHaveBeenCalled();
  });

  test('applies dragging class when isDragging is true', () => {
    const { container } = render(<QuestionEditor {...defaultProps} isDragging={true} />);
    
    expect(container.querySelector('.question-editor')).toHaveClass('dragging');
  });

  test('shows correct question type description', () => {
    const types = [
      { type: 'short_text', expected: 'Short Text(Upto 100 Characters)' },
      { type: 'long_text', expected: 'Long Text(Upto 500 Characters)' },
      { type: 'number', expected: 'Numeric  Value' },
      { type: 'date_picker', expected: 'DD/MM/YY' },
      { type: 'choice', expected: 'Dropdown selection' },
      { type: 'file_upload', expected: 'One file allowed' }
    ];
    
    
  });
});