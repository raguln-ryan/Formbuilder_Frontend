import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SectionEditor from '../SectionEditor';

// Mock dependencies
jest.mock('../../../styles/components/FormBuilder/SectionEditor.css', () => ({}));

// Mock console.log to verify it's called
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

// Mock child components
jest.mock('../FieldsSidebar', () => {
  return function MockFieldsSidebar({ formId }) {
    return <div data-testid="fields-sidebar">FieldsSidebar - FormId: {formId}</div>;
  };
});

jest.mock('../FormBuilderCanvas', () => {
  return function MockFormBuilderCanvas({ 
    questionsList, 
    questions, 
    onQuestionsChange, 
    formTitle, 
    formDescription,
    formId 
  }) {
    return (
      <div data-testid="form-builder-canvas">
        <div>FormBuilderCanvas</div>
        <div>Questions List Length: {questionsList?.length || 0}</div>
        <div>Questions Length: {questions?.length || 0}</div>
        <div>Form Title: {formTitle}</div>
        <div>Form Description: {formDescription}</div>
        <div>Form ID: {formId}</div>
        <button onClick={() => onQuestionsChange(['updated'])}>Update Questions</button>
      </div>
    );
  };
});

describe('SectionEditor', () => {
  const mockOnQuestionsChange = jest.fn();

  const defaultProps = {
    questions: [
      { _id: 'q1', question: 'Question 1', type: 'text' },
      { _id: 'q2', question: 'Question 2', type: 'number' }
    ],
    onQuestionsChange: mockOnQuestionsChange,
    formTitle: 'Test Form Title',
    formDescription: 'Test Form Description',
    formId: 'test-form-id'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.log.mockClear();
  });

  test('renders SectionEditor with all props', () => {
    render(<SectionEditor {...defaultProps} />);
    
    expect(screen.getByTestId('fields-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('form-builder-canvas')).toBeInTheDocument();
  });

  test('passes formId to FieldsSidebar', () => {
    render(<SectionEditor {...defaultProps} />);
    
    expect(screen.getByText('FieldsSidebar - FormId: test-form-id')).toBeInTheDocument();
  });

  test('passes all props to FormBuilderCanvas', () => {
    render(<SectionEditor {...defaultProps} />);
    
    expect(screen.getByText('Questions List Length: 2')).toBeInTheDocument();
    expect(screen.getByText('Questions Length: 2')).toBeInTheDocument();
    expect(screen.getByText('Form Title: Test Form Title')).toBeInTheDocument();
    expect(screen.getByText('Form Description: Test Form Description')).toBeInTheDocument();
    expect(screen.getByText('Form ID: test-form-id')).toBeInTheDocument();
  });

  test('logs props to console', () => {
    render(<SectionEditor {...defaultProps} />);
    
    expect(console.log).toHaveBeenCalledWith('SECTION EDITOR PROPS:', defaultProps);
    expect(console.log).toHaveBeenCalledWith('SECTION EDITOR RECEIVED:', {
      questions: defaultProps.questions,
      questionsLength: 2,
      formTitle: 'Test Form Title'
    });
    expect(console.log).toHaveBeenCalledWith('PASSING TO CANVAS - RIGHT BEFORE:', defaultProps.questions);
  });

  test('handles empty questions array', () => {
    const props = {
      ...defaultProps,
      questions: []
    };
    
    render(<SectionEditor {...props} />);
    
    expect(screen.getByText('Questions List Length: 0')).toBeInTheDocument();
    expect(screen.getByText('Questions Length: 0')).toBeInTheDocument();
    
    expect(console.log).toHaveBeenCalledWith('SECTION EDITOR RECEIVED:', {
      questions: [],
      questionsLength: 0,
      formTitle: 'Test Form Title'
    });
  });

  test('handles undefined questions', () => {
    const props = {
      ...defaultProps,
      questions: undefined
    };
    
    render(<SectionEditor {...props} />);
    
    expect(screen.getByText('Questions List Length: 0')).toBeInTheDocument();
    expect(screen.getByText('Questions Length: 0')).toBeInTheDocument();
    
    expect(console.log).toHaveBeenCalledWith('SECTION EDITOR RECEIVED:', {
      questions: undefined,
      questionsLength: undefined,
      formTitle: 'Test Form Title'
    });
  });

  test('handles null questions', () => {
    const props = {
      ...defaultProps,
      questions: null
    };
    
    render(<SectionEditor {...props} />);
    
    expect(screen.getByText('Questions List Length: 0')).toBeInTheDocument();
    expect(screen.getByText('Questions Length: 0')).toBeInTheDocument();
    
    expect(console.log).toHaveBeenCalledWith('SECTION EDITOR RECEIVED:', {
      questions: null,
      questionsLength: undefined,
      formTitle: 'Test Form Title'
    });
  });

  test('handles empty formTitle', () => {
    const props = {
      ...defaultProps,
      formTitle: ''
    };
    
    render(<SectionEditor {...props} />);
    
    expect(screen.getByText('Form Title:')).toBeInTheDocument();
  });

  test('handles empty formDescription', () => {
    const props = {
      ...defaultProps,
      formDescription: ''
    };
    
    render(<SectionEditor {...props} />);
    
    expect(screen.getByText('Form Description:')).toBeInTheDocument();
  });

  test('handles undefined formTitle', () => {
    const props = {
      ...defaultProps,
      formTitle: undefined
    };
    
    render(<SectionEditor {...props} />);
    
    expect(screen.getByText('Form Title:')).toBeInTheDocument();
  });

  test('handles undefined formDescription', () => {
    const props = {
      ...defaultProps,
      formDescription: undefined
    };
    
    render(<SectionEditor {...props} />);
    
    expect(screen.getByText('Form Description:')).toBeInTheDocument();
  });

  test('handles empty formId', () => {
    const props = {
      ...defaultProps,
      formId: ''
    };
    
    render(<SectionEditor {...props} />);
    
    expect(screen.getByText('FieldsSidebar - FormId:')).toBeInTheDocument();
    expect(screen.getByText('Form ID:')).toBeInTheDocument();
  });

  test('handles undefined formId', () => {
    const props = {
      ...defaultProps,
      formId: undefined
    };
    
    render(<SectionEditor {...props} />);
    
    // Default value should be empty string
    expect(screen.getByText('FieldsSidebar - FormId:')).toBeInTheDocument();
  });

  test('passes onQuestionsChange callback to FormBuilderCanvas', () => {
    const { getByText } = render(<SectionEditor {...defaultProps} />);
    
    const updateButton = getByText('Update Questions');
    updateButton.click();
    
    expect(mockOnQuestionsChange).toHaveBeenCalledWith(['updated']);
  });

  test('renders with correct CSS classes', () => {
    const { container } = render(<SectionEditor {...defaultProps} />);
    
    expect(container.querySelector('.section-editor')).toBeInTheDocument();
    expect(container.querySelector('.section-editor-left')).toBeInTheDocument();
    expect(container.querySelector('.section-editor-right')).toBeInTheDocument();
  });

  test('handles complex questions structure', () => {
    const complexQuestions = [
      { 
        _id: 'q1', 
        question: 'Complex Question 1', 
        type: 'choice',
        options: ['Option 1', 'Option 2']
      },
      { 
        _id: 'q2', 
        question: 'Complex Question 2', 
        type: 'date_picker',
        date_format: 'DD/MM/YYYY'
      },
      { 
        _id: 'q3', 
        question: 'Complex Question 3', 
        type: 'file_upload',
        max_size: 2048
      }
    ];
    
    const props = {
      ...defaultProps,
      questions: complexQuestions
    };
    
    render(<SectionEditor {...props} />);
    
    expect(screen.getByText('Questions List Length: 3')).toBeInTheDocument();
    expect(screen.getByText('Questions Length: 3')).toBeInTheDocument();
  });

  test('passes questionsList and questions as separate props', () => {
    render(<SectionEditor {...defaultProps} />);
    
    // Both questionsList and questions should be passed with same value
    expect(screen.getByText('Questions List Length: 2')).toBeInTheDocument();
    expect(screen.getByText('Questions Length: 2')).toBeInTheDocument();
  });

  test('handles all props being undefined', () => {
    const props = {
      questions: undefined,
      onQuestionsChange: undefined,
      formTitle: undefined,
      formDescription: undefined,
      formId: undefined
    };
    
    render(<SectionEditor {...props} />);
    
    expect(screen.getByTestId('fields-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('form-builder-canvas')).toBeInTheDocument();
  });

  test('handles all props being null', () => {
    const props = {
      questions: null,
      onQuestionsChange: null,
      formTitle: null,
      formDescription: null,
      formId: null
    };
    
    render(<SectionEditor {...props} />);
    
    expect(screen.getByTestId('fields-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('form-builder-canvas')).toBeInTheDocument();
  });

  test('destructures props correctly', () => {
    const props = {
      ...defaultProps,
      extraProp: 'should not be used'
    };
    
    render(<SectionEditor {...props} />);
    
    // Should only use the destructured props
    expect(screen.getByTestId('fields-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('form-builder-canvas')).toBeInTheDocument();
  });

  test('maintains prop references', () => {
    const questions = [{ _id: 'q1', question: 'Test' }];
    const onQuestionsChange = jest.fn();
    
    const props = {
      questions,
      onQuestionsChange,
      formTitle: 'Title',
      formDescription: 'Description',
      formId: 'id'
    };
    
    render(<SectionEditor {...props} />);
    
    // Verify the same references are passed
    const updateButton = screen.getByText('Update Questions');
    updateButton.click();
    
    expect(onQuestionsChange).toHaveBeenCalled();
  });

  test('renders both child components in correct order', () => {
    const { container } = render(<SectionEditor {...defaultProps} />);
    
    const leftSection = container.querySelector('.section-editor-left');
    const rightSection = container.querySelector('.section-editor-right');
    
    expect(leftSection).toContainElement(screen.getByTestId('fields-sidebar'));
    expect(rightSection).toContainElement(screen.getByTestId('form-builder-canvas'));
  });

  test('handles very long form titles and descriptions', () => {
    const props = {
      ...defaultProps,
      formTitle: 'A'.repeat(1000),
      formDescription: 'B'.repeat(1000)
    };
    
    render(<SectionEditor {...props} />);
    
    expect(screen.getByText(`Form Title: ${'A'.repeat(1000)}`)).toBeInTheDocument();
    expect(screen.getByText(`Form Description: ${'B'.repeat(1000)}`)).toBeInTheDocument();
  });

  test('handles special characters in props', () => {
    const props = {
      ...defaultProps,
      formTitle: '<script>alert("XSS")</script>',
      formDescription: '"; DROP TABLE forms; --',
      formId: '../../../etc/passwd'
    };
    
    render(<SectionEditor {...props} />);
    
    expect(screen.getByText('Form Title: <script>alert("XSS")</script>')).toBeInTheDocument();
    expect(screen.getByText('Form Description: "; DROP TABLE forms; --')).toBeInTheDocument();
    expect(screen.getByText('Form ID: ../../../etc/passwd')).toBeInTheDocument();
  });

  test('handles questions with missing properties', () => {
    const props = {
      ...defaultProps,
      questions: [
        { _id: 'q1' }, // Missing question and type
        { question: 'Question 2' }, // Missing _id and type
        { type: 'text' } // Missing _id and question
      ]
    };
    
    render(<SectionEditor {...props} />);
    
    expect(screen.getByText('Questions List Length: 3')).toBeInTheDocument();
  });

  test('handles numeric formId', () => {
    const props = {
      ...defaultProps,
      formId: 12345
    };
    
    render(<SectionEditor {...props} />);
    
    expect(screen.getByText('Form ID: 12345')).toBeInTheDocument();
  });

  test('handles boolean values in props', () => {
    const props = {
      ...defaultProps,
      formTitle: true,
      formDescription: false,
      formId: true
    };
    
    render(<SectionEditor {...props} />);
    
    expect(screen.getByText('Form Title: true')).toBeInTheDocument();
    expect(screen.getByText('Form Description: false')).toBeInTheDocument();
    expect(screen.getByText('Form ID: true')).toBeInTheDocument();
  });
});