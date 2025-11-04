import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuestionPreview from '../QuestionPreview';

describe('QuestionPreview Component', () => {
  const defaultProps = {
    formTitle: 'Test Form',
    formDescription: 'Test Description',
    questions: []
  };

  beforeEach(() => {
    document.body.classList.remove('preview-open');
  });

  test('renders form preview with title and description', () => {
    render(<QuestionPreview {...defaultProps} />);
    
    expect(screen.getByText('Test Form')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  test('renders with default title when not provided', () => {
    render(<QuestionPreview {...defaultProps} formTitle="" />);
    
    expect(screen.getByText('Untitled Form')).toBeInTheDocument();
  });

  test('renders empty state when no questions', () => {
    render(<QuestionPreview {...defaultProps} />);
    
    expect(screen.getByText('No questions to preview')).toBeInTheDocument();
    expect(screen.getByText('Add questions to see them here')).toBeInTheDocument();
  });

  test('adds preview-open class to body on mount', () => {
    render(<QuestionPreview {...defaultProps} />);
    
    expect(document.body.classList.contains('preview-open')).toBe(true);
  });

  test('removes preview-open class on unmount', () => {
    const { unmount } = render(<QuestionPreview {...defaultProps} />);
    
    expect(document.body.classList.contains('preview-open')).toBe(true);
    
    unmount();
    
    expect(document.body.classList.contains('preview-open')).toBe(false);
  });

  test('renders short text question', () => {
    const questions = [
      {
        _id: '1',
        type: 'short_text',
        question: 'What is your name?',
        required: true
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    expect(screen.getByText('1. What is your name?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your Answer')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('handles short text input change', () => {
    const questions = [
      {
        _id: '1',
        type: 'short_text',
        question: 'What is your name?'
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    const input = screen.getByPlaceholderText('Your Answer');
    fireEvent.change(input, { target: { value: 'John Doe' } });
    
    expect(input.value).toBe('John Doe');
  });

  test('renders long text question', () => {
    const questions = [
      {
        _id: '1',
        type: 'long_text',
        question: 'Describe yourself',
        description_enabled: true,
        description: 'Please be detailed'
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    expect(screen.getByText('1. Describe yourself')).toBeInTheDocument();
    expect(screen.getByText('Please be detailed')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your Answer')).toBeInTheDocument();
  });

  test('renders number question', () => {
    const questions = [
      {
        _id: '1',
        type: 'number',
        question: 'What is your age?'
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    const input = screen.getByPlaceholderText('Your Answer');
    expect(input.type).toBe('number');
  });

  

  test('renders choice/dropdown question', () => {
    const questions = [
      {
        _id: '1',
        type: 'choice',
        question: 'Select your country',
        options: [
          { _id: 'opt1', value: 'USA' },
          { _id: 'opt2', value: 'Canada' },
          { _id: 'opt3', value: 'UK' }
        ]
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    expect(screen.getByText('Select Answer')).toBeInTheDocument();
    expect(screen.getByText('USA')).toBeInTheDocument();
    expect(screen.getByText('Canada')).toBeInTheDocument();
    expect(screen.getByText('UK')).toBeInTheDocument();
  });

  test('handles dropdown selection', () => {
    const questions = [
      {
        _id: '1',
        type: 'choice',
        question: 'Select your country',
        options: [
          { _id: 'opt1', value: 'USA' },
          { _id: 'opt2', value: 'Canada' }
        ]
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'USA' } });
    
    expect(select.value).toBe('USA');
  });

  test('handles choice options as strings', () => {
    const questions = [
      {
        _id: '1',
        type: 'choice',
        question: 'Select option',
        options: ['Option 1', 'Option 2']
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  test('renders file upload question', () => {
    const questions = [
      {
        _id: '1',
        type: 'file_upload',
        question: 'Upload your resume'
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    expect(screen.getByText(/Drop files here or/)).toBeInTheDocument();
    expect(screen.getByText('Browse')).toBeInTheDocument();
    expect(screen.getByText(/Supported files: PDF, PNG, JPG/)).toBeInTheDocument();
  });

  test('handles file selection', () => {
    const questions = [
      {
        _id: '1',
        type: 'file_upload',
        question: 'Upload document'
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]');
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false
    });
    
    fireEvent.change(input);
    
    expect(screen.getByText('📎 test.pdf')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  test('handles file remove', () => {
    const questions = [
      {
        _id: '1',
        type: 'file_upload',
        question: 'Upload document'
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    // First upload a file
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]');
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false
    });
    
    fireEvent.change(input);
    
    // Then remove it
    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);
    
    expect(screen.queryByText('📎 test.pdf')).not.toBeInTheDocument();
    expect(screen.getByText(/Drop files here or/)).toBeInTheDocument();
  });

  test('handles click on file upload area', () => {
    const questions = [
      {
        _id: '1',
        type: 'file_upload',
        question: 'Upload document'
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    const fileInput = document.querySelector('input[type="file"]');
    const clickSpy = jest.spyOn(fileInput, 'click');
    
    const uploadArea = screen.getByText(/Drop files here or/).parentElement;
    fireEvent.click(uploadArea);
    
    expect(clickSpy).toHaveBeenCalled();
  });

  test('handles clear form button', () => {
    const questions = [
      {
        _id: '1',
        type: 'short_text',
        question: 'Question 1'
      },
      {
        _id: '2',
        type: 'number',
        question: 'Question 2'
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    // Fill in some values
    const textInput = screen.getAllByPlaceholderText('Your Answer')[0];
    const numberInput = screen.getAllByPlaceholderText('Your Answer')[1];
    
    fireEvent.change(textInput, { target: { value: 'Test' } });
    fireEvent.change(numberInput, { target: { value: '42' } });
    
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
    
    // Clear form
    const clearButton = screen.getByText('Clear Form');
    fireEvent.click(clearButton);
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to clear all form fields?');
    expect(textInput.value).toBe('');
    expect(numberInput.value).toBe('');
  });

  test('cancels clear form when user declines', () => {
    const questions = [
      {
        _id: '1',
        type: 'short_text',
        question: 'Question 1'
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    const input = screen.getByPlaceholderText('Your Answer');
    fireEvent.change(input, { target: { value: 'Test' } });
    
    window.confirm = jest.fn(() => false);
    
    const clearButton = screen.getByText('Clear Form');
    fireEvent.click(clearButton);
    
    expect(input.value).toBe('Test');
  });

  test('disables clear form button when no questions', () => {
    render(<QuestionPreview {...defaultProps} />);
    
    const clearButton = screen.getByText('Clear Form');
    expect(clearButton).toBeDisabled();
  });

  test('renders multiple questions with correct numbering', () => {
    const questions = [
      {
        _id: '1',
        type: 'short_text',
        question: 'First question'
      },
      {
        _id: '2',
        type: 'short_text',
        question: 'Second question'
      },
      {
        _id: '3',
        type: 'short_text',
        question: 'Third question'
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    expect(screen.getByText('1. First question')).toBeInTheDocument();
    expect(screen.getByText('2. Second question')).toBeInTheDocument();
    expect(screen.getByText('3. Third question')).toBeInTheDocument();
  });

  test('handles questions without _id using index', () => {
    const questions = [
      {
        type: 'short_text',
        question: 'Question without ID'
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    const input = screen.getByPlaceholderText('Your Answer');
    fireEvent.change(input, { target: { value: 'Test' } });
    
    expect(input.value).toBe('Test');
  });

  test('clears file inputs when clearing form', () => {
    const questions = [
      {
        _id: '1',
        type: 'file_upload',
        question: 'Upload file'
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    const fileInput = document.querySelector('input[type="file"]');
    
    // Mock file input value
    Object.defineProperty(fileInput, 'value', {
      writable: true,
      value: 'test.pdf'
    });
    
    window.confirm = jest.fn(() => true);
    
    const clearButton = screen.getByText('Clear Form');
    fireEvent.click(clearButton);
    
    expect(fileInput.value).toBe('');
  });

  test('renders question with default text when question text is missing', () => {
    const questions = [
      {
        _id: '1',
        type: 'short_text',
        question: ''
      }
    ];
    
    render(<QuestionPreview {...defaultProps} questions={questions} />);
    
    expect(screen.getByText('1. Untitled Question')).toBeInTheDocument();
  });
});