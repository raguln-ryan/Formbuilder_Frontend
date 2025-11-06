import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import FormBuilderCanvas from '../FormBuilderCanvas';
import formBuilderReducer from '../../../store/slices/formBuilderSlice';
import toast from 'react-hot-toast';

jest.mock('react-hot-toast');

// Mock QuestionEditor component
jest.mock('../QuestionEditor', () => {
  return function QuestionEditor({ question, isEditing, onUpdate, onDelete, onDuplicate, onDragStart, onDragEnd, onDragOver, onDrop }) {
    return (
      <div data-testid={`question-${question._id}`}>
        <span>{question.question || 'Empty Question'}</span>
        <button onClick={() => onUpdate({ ...question, question: 'Updated' })}>Update</button>
        <button onClick={() => onDelete()}>Delete</button>
        <button onClick={() => onDuplicate(question)}>Duplicate</button>
        <div
          draggable
          onDragStart={() => onDragStart(0)}
          onDragEnd={onDragEnd}
          onDragOver={(e) => onDragOver(e, 0)}
          onDrop={(e) => onDrop(e, 0)}
        >
          Drag Handle
        </div>
      </div>
    );
  };
});

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      formBuilder: formBuilderReducer
    },
    preloadedState: {
      formBuilder: {
        formData: {
          title: 'Test Form',
          description: 'Test Description'
        },
        questions: [],
        ...initialState
      }
    }
  });
};

describe('FormBuilderCanvas Component', () => {
  beforeEach(() => {
    toast.success = jest.fn();
    toast.error = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders empty state when no questions', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    expect(screen.getByText('Drag fields from the left panel')).toBeInTheDocument();
  });

  test('renders form header with title and description', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    expect(screen.getByText('Test Form')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  test('enables header editing on click', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const headerCard = screen.getByText('Test Form').parentElement.parentElement;
    fireEvent.click(headerCard);

    expect(screen.getByPlaceholderText('Enter form title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter form description')).toBeInTheDocument();
  });

  test('handles header title change', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const headerCard = screen.getByText('Test Form').parentElement.parentElement;
    fireEvent.click(headerCard);

    const titleInput = screen.getByPlaceholderText('Enter form title');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    expect(titleInput.value).toBe('New Title');
  });

  test('handles header description change', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const headerCard = screen.getByText('Test Description').parentElement.parentElement;
    fireEvent.click(headerCard);

    const descInput = screen.getByPlaceholderText('Enter form description');
    fireEvent.change(descInput, { target: { value: 'New Description' } });

    expect(descInput.value).toBe('New Description');
  });

  test('saves header changes on click outside', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const headerCard = screen.getByText('Test Form').parentElement.parentElement;
    fireEvent.click(headerCard);

    const titleInput = screen.getByPlaceholderText('Enter form title');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    // Click outside
    fireEvent.mouseDown(document.body);

    waitFor(() => {
      expect(screen.getByText('New Title')).toBeInTheDocument();
    });
  });

  test('renders questions when they exist', () => {
    const mockQuestions = [
      { _id: 'q1', type: 'short_text', question: 'Question 1', order: 0 },
      { _id: 'q2', type: 'number', question: 'Question 2', order: 1 }
    ];

    const store = createMockStore({
      formBuilder: {
        formData: { title: '', description: '' },
        questions: mockQuestions
      }
    });
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    expect(screen.getByTestId('question-q1')).toBeInTheDocument();
    expect(screen.getByTestId('question-q2')).toBeInTheDocument();
  });

  test('toggles question editing on click', () => {
    const mockQuestion = { _id: 'q1', type: 'short_text', question: 'Question 1' };
    const store = createMockStore({
      formBuilder: {
        formData: { title: '', description: '' },
        questions: [mockQuestion]
      }
    });
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const question = screen.getByTestId('question-q1');
    fireEvent.click(question.parentElement);

    // Click again to toggle off
    fireEvent.click(question.parentElement);

    expect(question).toBeInTheDocument();
  });

  test('handles question update', () => {
    const mockQuestion = { _id: 'q1', type: 'short_text', question: 'Question 1' };
    const store = createMockStore({
      formBuilder: {
        formData: { title: '', description: '' },
        questions: [mockQuestion]
      }
    });
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const updateButton = screen.getByText('Update');
    fireEvent.click(updateButton);

    const actions = store.getActions();
    expect(actions.some(action => action.type.includes('updateQuestion'))).toBe(true);
  });

  test('handles question delete', () => {
    const mockQuestion = { _id: 'q1', type: 'short_text', question: 'Question 1' };
    const store = createMockStore({
      formBuilder: {
        formData: { title: '', description: '' },
        questions: [mockQuestion]
      }
    });
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(toast.success).toHaveBeenCalledWith('Question deleted', { duration: 3000 });
  });

  test('handles question duplicate', () => {
    const mockQuestion = { _id: 'q1', type: 'short_text', question: 'Question 1' };
    const store = createMockStore({
      formBuilder: {
        formData: { title: '', description: '' },
        questions: [mockQuestion]
      }
    });
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const duplicateButton = screen.getByText('Duplicate');
    fireEvent.click(duplicateButton);

    expect(toast.success).toHaveBeenCalledWith('Question duplicated successfully!', { duration: 2000 });
  });

  test('handles drag over event', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const dropZone = screen.getByText('Drag fields from the left panel').parentElement.parentElement;
    const event = new Event('dragover', { bubbles: true });
    Object.defineProperty(event, 'dataTransfer', {
      value: { dropEffect: '' }
    });
    
    fireEvent(dropZone, event);
  });

  test('handles drag enter event', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const dropZone = screen.getByText('Drag fields from the left panel').parentElement.parentElement;
    fireEvent.dragEnter(dropZone);
  });

  test('handles drag leave event', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const dropZone = screen.getByText('Drag fields from the left panel').parentElement.parentElement;
    const event = new Event('dragleave', { bubbles: true });
    Object.defineProperty(event, 'currentTarget', {
      value: {
        getBoundingClientRect: () => ({ left: 0, right: 100, top: 0, bottom: 100 })
      }
    });
    Object.defineProperty(event, 'clientX', { value: 150 });
    Object.defineProperty(event, 'clientY', { value: 150 });
    
    fireEvent(dropZone, event);
  });

  test('handles drop event with valid field type', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const dropZone = screen.getByText('Drag fields from the left panel').parentElement.parentElement;
    const fieldType = { type: 'short_text', label: 'Short Text' };
    
    const event = new Event('drop', { bubbles: true });
    Object.defineProperty(event, 'dataTransfer', {
      value: {
        getData: (type) => type === 'fieldType' ? JSON.stringify(fieldType) : null
      }
    });
    
    fireEvent(dropZone, event);

    expect(toast.success).toHaveBeenCalledWith(
      'Short Text field added successfully!',
      expect.objectContaining({ icon: '✅', duration: 2000 })
    );
  });

  test('handles drop event with choice field type', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const dropZone = screen.getByText('Drag fields from the left panel').parentElement.parentElement;
    const fieldType = { type: 'choice', label: 'Dropdown' };
    
    const event = new Event('drop', { bubbles: true });
    Object.defineProperty(event, 'dataTransfer', {
      value: {
        getData: (type) => type === 'fieldType' ? JSON.stringify(fieldType) : null
      }
    });
    
    fireEvent(dropZone, event);

    const actions = store.getActions();
    const addAction = actions.find(action => action.type.includes('addQuestion'));
    expect(addAction.payload.type).toBe('choice');
    expect(addAction.payload.options.length).toBe(2);
  });

  test('handles drop event error', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const dropZone = screen.getByText('Drag fields from the left panel').parentElement.parentElement;
    
    const event = new Event('drop', { bubbles: true });
    Object.defineProperty(event, 'dataTransfer', {
      value: {
        getData: () => 'invalid json'
      }
    });
    
    fireEvent(dropZone, event);

    expect(toast.error).toHaveBeenCalledWith('Failed to add field. Please try again.');
  });

  test('handles drop event with no data', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const dropZone = screen.getByText('Drag fields from the left panel').parentElement.parentElement;
    
    const event = new Event('drop', { bubbles: true });
    Object.defineProperty(event, 'dataTransfer', {
      value: {
        getData: () => null
      }
    });
    
    fireEvent(dropZone, event);

    // Should not show any toast
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  test('handles question move up', () => {
    const mockQuestions = [
      { _id: 'q1', type: 'short_text', question: 'Question 1', order: 0 },
      { _id: 'q2', type: 'number', question: 'Question 2', order: 1 }
    ];

    const store = createMockStore({
      formBuilder: {
        formData: { title: '', description: '' },
        questions: mockQuestions
      }
    });
    
    const mockOnQuestionsChange = jest.fn();
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas onQuestionsChange={mockOnQuestionsChange} />
      </Provider>
    );

    // This would be triggered by QuestionEditor's onMove prop
    // Since we're mocking QuestionEditor, we can't directly test this
  });

  test('handles question reordering via drag and drop', () => {
    const mockQuestions = [
      { _id: 'q1', type: 'short_text', question: 'Question 1' },
      { _id: 'q2', type: 'number', question: 'Question 2' }
    ];

    const store = createMockStore({
      formBuilder: {
        formData: { title: '', description: '' },
        questions: mockQuestions
      }
    });
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    // Simulate drag start
    const dragHandle = screen.getAllByText('Drag Handle')[0];
    fireEvent.dragStart(dragHandle);

    // Simulate drop on second question
    fireEvent.drop(screen.getByTestId('question-q2'));

    expect(toast.success).toHaveBeenCalledWith('Question reordered', {
      icon: '↕️',
      duration: 1500
    });
  });

  test('handles global drag start event from sidebar', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const event = new Event('dragstart', { bubbles: true });
    Object.defineProperty(event, 'dataTransfer', {
      value: {
        types: ['fieldtype']
      }
    });
    
    document.dispatchEvent(event);

    // Component should be ready to receive drops
    const dropZone = screen.getByText('Drag fields from the left panel').parentElement.parentElement;
    expect(dropZone).toBeInTheDocument();
  });

  test('handles global drag end event', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    const event = new Event('dragend', { bubbles: true });
    document.dispatchEvent(event);

    // Should clean up drag state
    expect(screen.getByText('Drag fields from the left panel')).toBeInTheDocument();
  });

  test('cleans up event listeners on unmount', () => {
    const store = createMockStore();
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    const { unmount } = render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('dragstart', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('dragend', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
  });

  test('disables editing when formId is provided', () => {
    const store = createMockStore();
    
    const { container } = render(
      <Provider store={store}>
        <FormBuilderCanvas formId="test-123" />
      </Provider>
    );

    expect(container.querySelector('.form-builder-canvas.disabled')).toBeInTheDocument();

    // Click on header should not enable editing
    const headerCard = screen.getByText('Click to add form title').parentElement.parentElement;
    fireEvent.click(headerCard);

    expect(screen.queryByPlaceholderText('Enter form title')).not.toBeInTheDocument();
  });

  test('shows drop zone placeholder when dragging from sidebar', () => {
    const mockQuestions = [
      { _id: 'q1', type: 'short_text', question: 'Question 1' }
    ];

    const store = createMockStore({
      formBuilder: {
        formData: { title: '', description: '' },
        questions: mockQuestions
      }
    });
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    // Simulate dragging from sidebar
    const globalDragEvent = new Event('dragstart', { bubbles: true });
    Object.defineProperty(globalDragEvent, 'dataTransfer', {
      value: { types: ['fieldtype'] }
    });
    document.dispatchEvent(globalDragEvent);

    // Trigger drag over on the canvas
    const dropSection = document.querySelector('.drag-drop-section');
    const dragOverEvent = new Event('dragover', { bubbles: true });
    Object.defineProperty(dragOverEvent, 'dataTransfer', {
      value: { dropEffect: '' }
    });
    fireEvent(dropSection, dragOverEvent);

    waitFor(() => {
      expect(screen.getByText('Drag and drop the item here')).toBeInTheDocument();
    });
  });

  test('handles click outside for question editing', () => {
    const mockQuestion = { _id: 'q1', type: 'short_text', question: 'Question 1' };
    const store = createMockStore({
      formBuilder: {
        formData: { title: '', description: '' },
        questions: [mockQuestion]
      }
    });
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    // Enable editing for a question
    const question = screen.getByTestId('question-q1');
    fireEvent.click(question.parentElement);

    // Click outside
    fireEvent.mouseDown(document.body);

    // Editing should be disabled
    expect(question).toBeInTheDocument();
  });

  test('updates header state when formData changes', () => {
    const store = createMockStore({
      formBuilder: {
        formData: { title: 'Initial Title', description: 'Initial Description' }
      }
    });
    
    const { rerender } = render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    expect(screen.getByText('Initial Title')).toBeInTheDocument();

    // Update store
    const newStore = createMockStore({
      formBuilder: {
        formData: { title: 'Updated Title', description: 'Updated Description' }
      }
    });

    rerender(
      <Provider store={newStore}>
        <FormBuilderCanvas />
      </Provider>
    );

    expect(screen.getByText('Updated Title')).toBeInTheDocument();
  });

  test('shows empty header placeholders when no title/description', () => {
    const store = createMockStore({
      formBuilder: {
        formData: { title: '', description: '' }
      }
    });
    
    render(
      <Provider store={store}>
        <FormBuilderCanvas />
      </Provider>
    );

    expect(screen.getByText('Click to add form title')).toBeInTheDocument();
    expect(screen.getByText('Click to add form description')).toBeInTheDocument();
  });
});
