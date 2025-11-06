import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import QuestionEditor from '../QuestionEditor';
import formBuilderReducer from '../../../store/slices/formBuilderSlice';

// Mock the components
jest.mock('../../Common/Input', () => {
  return function Input({ value, onChange, placeholder, type, label, rows }) {
    if (type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          aria-label={label}
        />
      );
    }
    return (
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    );
  };
});

jest.mock('../../Common/Button', () => {
  return function Button({ children, onClick, size }) {
    return (
      <button onClick={onClick} className={size}>
        {children}
      </button>
    );
  };
});

const createMockStore = (questions = []) => {
  return configureStore({
    reducer: {
      formBuilder: formBuilderReducer
    },
    preloadedState: {
      formBuilder: {
        questions: questions
      }
    }
  });
};

describe('QuestionEditor Component', () => {
  const mockQuestion = {
    _id: 'test-id',
    type: 'short_text',
    question: 'Test Question',
    description_enabled: false,
    description: '',
    required: false,
    options: []
  };

  const defaultProps = {
    question: mockQuestion,
    index: 0,
    isEditing: false,
    onDragStart: jest.fn(),
    onDragEnd: jest.fn(),
    onDragOver: jest.fn(),
    onDrop: jest.fn(),
    isDragging: false
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders in display mode when not editing', () => {
    const store = createMockStore([mockQuestion]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Test Question')).toBeInTheDocument();
  });

  test('renders in edit mode when editing', () => {
    const store = createMockStore([mockQuestion]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} isEditing={true} />
      </Provider>
    );

    expect(screen.getByPlaceholderText('Add short text title')).toBeInTheDocument();
  });

  test('handles field change', () => {
    const store = createMockStore([mockQuestion]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} isEditing={true} />
      </Provider>
    );

    const input = screen.getByPlaceholderText('Add short text title');
    fireEvent.change(input, { target: { value: 'Updated Question' } });

    expect(input.value).toBe('Updated Question');
  });

  test('handles description toggle and input', () => {
    const store = createMockStore([mockQuestion]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} isEditing={true} />
      </Provider>
    );

    const descToggle = screen.getByText('Description').parentElement.querySelector('input[type="checkbox"]');
    fireEvent.click(descToggle);

    waitFor(() => {
      const descInput = screen.getByPlaceholderText('Add helpful text for this question');
      expect(descInput).toBeInTheDocument();
      fireEvent.change(descInput, { target: { value: 'Test description' } });
      expect(descInput.value).toBe('Test description');
    });
  });

  test('handles required toggle', () => {
    const store = createMockStore([mockQuestion]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} isEditing={true} />
      </Provider>
    );

    const requiredToggle = screen.getByText('Required').parentElement.querySelector('input[type="checkbox"]');
    fireEvent.click(requiredToggle);

    expect(requiredToggle.checked).toBe(true);
  });

  test('handles duplicate question', () => {
    const store = createMockStore([mockQuestion]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} isEditing={true} />
      </Provider>
    );

    const duplicateBtn = screen.getByTitle('Duplicate Question');
    fireEvent.click(duplicateBtn);

    const actions = store.getActions();
    expect(actions.some(action => action.type.includes('duplicateQuestion'))).toBe(true);
  });

  test('handles delete question', () => {
    const store = createMockStore([mockQuestion]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} isEditing={true} />
      </Provider>
    );

    const deleteBtn = screen.getByTitle('Delete Question');
    fireEvent.click(deleteBtn);

    const actions = store.getActions();
    expect(actions.some(action => action.type.includes('deleteQuestion'))).toBe(true);
  });

  test('renders choice question with options', () => {
    const choiceQuestion = {
      ...mockQuestion,
      type: 'choice',
      single_choice: true,
      options: [
        { _id: 'opt1', value: 'Option 1' },
        { _id: 'opt2', value: 'Option 2' }
      ]
    };

    const store = createMockStore([choiceQuestion]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} question={choiceQuestion} isEditing={true} />
      </Provider>
    );

    expect(screen.getByDisplayValue('Option 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Option 2')).toBeInTheDocument();
  });

  test('handles add option for choice question', () => {
    const choiceQuestion = {
      ...mockQuestion,
      type: 'choice',
      options: [
        { _id: 'opt1', value: 'Option 1' },
        { _id: 'opt2', value: 'Option 2' }
      ]
    };

    const store = createMockStore([choiceQuestion]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} question={choiceQuestion} isEditing={true} />
      </Provider>
    );

    const addButton = screen.getByText('+ Add Option');
    fireEvent.click(addButton);

    waitFor(() => {
      expect(screen.getByDisplayValue('Option 3')).toBeInTheDocument();
    });
  });

  test('handles remove option for choice question', () => {
    const choiceQuestion = {
      ...mockQuestion,
      type: 'choice',
      options: [
        { _id: 'opt1', value: 'Option 1' },
        { _id: 'opt2', value: 'Option 2' },
        { _id: 'opt3', value: 'Option 3' }
      ]
    };

    const store = createMockStore([choiceQuestion]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} question={choiceQuestion} isEditing={true} />
      </Provider>
    );

    const removeButtons = screen.getAllByTitle('Remove option');
    fireEvent.click(removeButtons[0]);

    waitFor(() => {
      expect(screen.queryByDisplayValue('Option 1')).not.toBeInTheDocument();
    });
  });

  test('prevents removing option when only 2 options exist', () => {
    const choiceQuestion = {
      ...mockQuestion,
      type: 'choice',
      options: [
        { _id: 'opt1', value: 'Option 1' },
        { _id: 'opt2', value: 'Option 2' }
      ]
    };

    const store = createMockStore([choiceQuestion]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} question={choiceQuestion} isEditing={true} />
      </Provider>
    );

    const removeButtons = screen.getAllByTitle('Remove option');
    expect(removeButtons[0]).toBeDisabled();
  });

  test('handles single/multiple choice toggle', () => {
    const choiceQuestion = {
      ...mockQuestion,
      type: 'choice',
      single_choice: true,
      multiple_choice: false,
      options: []
    };

    const store = createMockStore([choiceQuestion]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} question={choiceQuestion} isEditing={true} />
      </Provider>
    );

    const multiSelect = screen.getByLabelText(/Multi Select/);
    fireEvent.click(multiSelect);

    const actions = store.getActions();
    expect(actions.some(action => action.type.includes('updateQuestion'))).toBe(true);
  });

  test('handles date picker format change', () => {
    const dateQuestion = {
      ...mockQuestion,
      type: 'date_picker',
      date_format: 'DD/MM/YYYY'
    };

    const store = createMockStore([dateQuestion]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} question={dateQuestion} isEditing={true} />
      </Provider>
    );

    const formatRadio = screen.getByLabelText('DD-MM-YYYY');
    fireEvent.click(formatRadio);

    const actions = store.getActions();
    expect(actions.some(action => action.type.includes('updateQuestion'))).toBe(true);
  });

  test('renders file upload question type', () => {
    const fileQuestion = {
      ...mockQuestion,
      type: 'file_upload'
    };

    const store = createMockStore([fileQuestion]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} question={fileQuestion} />
      </Provider>
    );

    expect(screen.getByText('File Upload (Only one file allowed)')).toBeInTheDocument();
  });

  test('handles drag start event', () => {
    const store = createMockStore([mockQuestion]);
    const onDragStart = jest.fn();
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} onDragStart={onDragStart} isEditing={true} />
      </Provider>
    );

    const dragHandle = screen.getByTitle('Drag to reorder');
    const mockDataTransfer = {
      effectAllowed: '',
      setData: jest.fn()
    };
    
    fireEvent.dragStart(dragHandle, { dataTransfer: mockDataTransfer });
    
    expect(onDragStart).toHaveBeenCalledWith(0);
    expect(mockDataTransfer.effectAllowed).toBe('move');
  });

  test('handles drag over event', () => {
    const store = createMockStore([mockQuestion]);
    const onDragOver = jest.fn();
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} onDragOver={onDragOver} />
      </Provider>
    );

    const element = screen.getByText('Test Question').parentElement;
    const event = new Event('dragover', { bubbles: true });
    fireEvent(element, event);
    
    expect(onDragOver).toHaveBeenCalled();
  });

  test('handles drag drop event', () => {
    const store = createMockStore([mockQuestion]);
    const onDrop = jest.fn();
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} onDrop={onDrop} />
      </Provider>
    );

    const element = screen.getByText('Test Question').parentElement;
    fireEvent.drop(element);
    
    expect(onDrop).toHaveBeenCalledWith(expect.any(Object), 0);
  });

  test('handles drag end event', () => {
    const store = createMockStore([mockQuestion]);
    const onDragEnd = jest.fn();
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} onDragEnd={onDragEnd} isEditing={true} />
      </Provider>
    );

    const dragHandle = screen.getByTitle('Drag to reorder');
    fireEvent.dragEnd(dragHandle);
    
    expect(onDragEnd).toHaveBeenCalled();
  });

  test('displays placeholder when question has no title', () => {
    const emptyQuestion = {
      ...mockQuestion,
      question: ''
    };

    const store = createMockStore([emptyQuestion]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} question={emptyQuestion} />
      </Provider>
    );

    expect(screen.getByText('Click here to add short text title')).toBeInTheDocument();
  });

  test('displays description when enabled', () => {
    const questionWithDesc = {
      ...mockQuestion,
      description_enabled: true,
      description: 'Test description text'
    };

    const store = createMockStore([questionWithDesc]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} question={questionWithDesc} />
      </Provider>
    );

    expect(screen.getByText('Test description text')).toBeInTheDocument();
  });

  test('updates local state when question prop changes', () => {
    const store = createMockStore([mockQuestion]);
    
    const { rerender } = render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} />
      </Provider>
    );

    const updatedQuestion = {
      ...mockQuestion,
      question: 'Updated Question Title'
    };

    rerender(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} question={updatedQuestion} />
      </Provider>
    );

    expect(screen.getByText('Updated Question Title')).toBeInTheDocument();
  });

  test('applies dragging class when isDragging is true', () => {
    const store = createMockStore([mockQuestion]);
    
    const { container } = render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} isDragging={true} />
      </Provider>
    );

    expect(container.querySelector('.dragging')).toBeInTheDocument();
  });

  test('handles option change for choice question', () => {
    const choiceQuestion = {
      ...mockQuestion,
      type: 'choice',
      options: [
        { _id: 'opt1', value: 'Option 1' },
        { _id: 'opt2', value: 'Option 2' }
      ]
    };

    const store = createMockStore([choiceQuestion]);
    
    render(
      <Provider store={store}>
        <QuestionEditor {...defaultProps} question={choiceQuestion} isEditing={true} />
      </Provider>
    );

    const optionInput = screen.getByDisplayValue('Option 1');
    fireEvent.change(optionInput, { target: { value: 'Modified Option' } });

    expect(optionInput.value).toBe('Modified Option');
  });

  test('displays correct type description for all question types', () => {
    const types = [
      { type: 'short_text', desc: 'Short Text (Up to 100 Characters)' },
      { type: 'long_text', desc: 'Long Text (Up to 500 Characters)' },
      { type: 'number', desc: 'Numeric Value' },
      { type: 'date_picker', desc: 'DD/MM/YY' },
           { type: 'choice', desc: 'Dropdown selection' },
      { type: 'file_upload', desc: 'One file allowed' }
    ];

    types.forEach(({ type, desc }) => {
      const testQuestion = { ...mockQuestion, type };
      const store = createMockStore([testQuestion]);
      
      const { container } = render(
        <Provider store={store}>
          <QuestionEditor {...defaultProps} question={testQuestion} />
        </Provider>
      );

      if (type !== 'file_upload') {
        expect(container.textContent).toContain(desc);
      }
    });
  });
});

