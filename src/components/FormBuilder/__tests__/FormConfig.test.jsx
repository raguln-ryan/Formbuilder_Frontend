import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import FormConfig from '../FormConfig';
import formBuilderReducer from '../../../store/slices/formBuilderSlice';
import toast from 'react-hot-toast';

jest.mock('react-hot-toast');

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      formBuilder: formBuilderReducer
    },
    preloadedState: {
      formBuilder: {
        formData: {
          title: '',
          description: '',
          isVisible: false
        },
        errors: {},
        TITLE_CHAR_LIMIT: 100,
        DESCRIPTION_CHAR_LIMIT: 500,
        ...initialState
      }
    }
  });
};

describe('FormConfig Component', () => {
  let mockOnSaveAsDraft;
  let mockOnNext;

  beforeEach(() => {
    mockOnSaveAsDraft = jest.fn();
    mockOnNext = jest.fn();
    toast.success = jest.fn();
    toast.error = jest.fn();
    toast.dismiss = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders form config with all fields', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <FormConfig onSaveAsDraft={mockOnSaveAsDraft} onNext={mockOnNext} />
      </Provider>
    );

    expect(screen.getByText('Form Details')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Form Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Summarize the form's purpose for internal reference.")).toBeInTheDocument();
    expect(screen.getByText('Form Visibility')).toBeInTheDocument();
  });

  test('handles title input change', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <FormConfig onSaveAsDraft={mockOnSaveAsDraft} onNext={mockOnNext} />
      </Provider>
    );

    const titleInput = screen.getByPlaceholderText('Enter Form Name');
    fireEvent.change(titleInput, { target: { value: 'Test Form' } });

    expect(titleInput.value).toBe('Test Form');
  });

  test('shows error when title is empty', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <FormConfig onSaveAsDraft={mockOnSaveAsDraft} onNext={mockOnNext} />
      </Provider>
    );

    const titleInput = screen.getByPlaceholderText('Enter Form Name');
    fireEvent.change(titleInput, { target: { value: '' } });

    expect(toast.error).toHaveBeenCalledWith('Form name is required', { id: 'title-validation' });
  });

  test('dismisses error when title is entered', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <FormConfig onSaveAsDraft={mockOnSaveAsDraft} onNext={mockOnNext} />
      </Provider>
    );

    const titleInput = screen.getByPlaceholderText('Enter Form Name');
    fireEvent.change(titleInput, { target: { value: 'Valid Title' } });

    expect(toast.dismiss).toHaveBeenCalledWith('title-validation');
  });

  test('handles description input change', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <FormConfig onSaveAsDraft={mockOnSaveAsDraft} onNext={mockOnNext} />
      </Provider>
    );

    const descriptionInput = screen.getByPlaceholderText("Summarize the form's purpose for internal reference.");
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });

    expect(descriptionInput.value).toBe('Test Description');
  });

  test('handles visibility toggle - turn on', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <FormConfig onSaveAsDraft={mockOnSaveAsDraft} onNext={mockOnNext} />
      </Provider>
    );

    const visibilityToggle = screen.getByRole('checkbox');
    fireEvent.click(visibilityToggle);

    expect(toast.success).toHaveBeenCalledWith('Form is now visible', { icon: '👁️' });
  });

  test('handles visibility toggle - turn off', () => {
    const store = createMockStore({
      formBuilder: {
        formData: {
          title: '',
          description: '',
          isVisible: true
        }
      }
    });
    
    render(
      <Provider store={store}>
        <FormConfig onSaveAsDraft={mockOnSaveAsDraft} onNext={mockOnNext} />
      </Provider>
    );

    const visibilityToggle = screen.getByRole('checkbox');
    fireEvent.click(visibilityToggle);

    expect(toast.success).toHaveBeenCalledWith('Form is now hidden', { icon: '🙈' });
  });

  test('handles save as draft - success', async () => {
    mockOnSaveAsDraft.mockResolvedValue();
    const store = createMockStore({
      formBuilder: {
        formData: {
          title: 'Test Form',
          description: 'Test Description'
        }
      }
    });

    render(
      <Provider store={store}>
        <FormConfig onSaveAsDraft={mockOnSaveAsDraft} onNext={mockOnNext} />
      </Provider>
    );

    const saveButton = screen.getByText('Save as Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSaveAsDraft).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Form saved as draft successfully!');
    });
  });

  test('handles save as draft - failure', async () => {
    mockOnSaveAsDraft.mockRejectedValue(new Error('Save failed'));
    const store = createMockStore({
      formBuilder: {
        formData: {
          title: 'Test Form',
          description: 'Test Description'
        }
      }
    });

    render(
      <Provider store={store}>
        <FormConfig onSaveAsDraft={mockOnSaveAsDraft} onNext={mockOnNext} />
      </Provider>
    );

    const saveButton = screen.getByText('Save as Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSaveAsDraft).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Failed to save form as draft');
    });
  });

  test('handles next button with valid form', () => {
    const store = createMockStore({
      formBuilder: {
        formData: {
          title: 'Test Form',
          description: 'Test Description'
        }
      }
    });

    render(
      <Provider store={store}>
        <FormConfig onSaveAsDraft={mockOnSaveAsDraft} onNext={mockOnNext} />
      </Provider>
    );

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(toast.success).toHaveBeenCalledWith('Moving to next step...');
    expect(mockOnNext).toHaveBeenCalled();
  });

  test('handles next button with invalid form', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <FormConfig onSaveAsDraft={mockOnSaveAsDraft} onNext={mockOnNext} />
      </Provider>
    );

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(toast.error).toHaveBeenCalledWith('Please fill in all required fields');
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  test('disables buttons when saving', () => {
    const store = createMockStore({
      formBuilder: {
        formData: {
          title: 'Test Form',
          description: 'Test Description'
        }
      }
    });

    render(
      <Provider store={store}>
        <FormConfig onSaveAsDraft={mockOnSaveAsDraft} onNext={mockOnNext} saving={true} />
      </Provider>
    );

    expect(screen.getByText('Saving...')).toBeDisabled();
    expect(screen.getByText('Next')).toBeDisabled();
  });

  test('disables inputs when formId is provided', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <FormConfig onSaveAsDraft={mockOnSaveAsDraft} onNext={mockOnNext} formId="123" />
      </Provider>
    );

    expect(screen.getByPlaceholderText('Enter Form Name')).toBeDisabled();
    expect(screen.getByPlaceholderText("Summarize the form's purpose for internal reference.")).toBeDisabled();
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  test('shows error messages from store', () => {
    const store = createMockStore({
      formBuilder: {
        formData: {
          title: '',
          description: ''
        },
        errors: {
          title: 'Title is required',
          description: 'Description is required'
        }
      }
    });

    render(
      <Provider store={store}>
        <FormConfig onSaveAsDraft={mockOnSaveAsDraft} onNext={mockOnNext} />
      </Provider>
    );

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
  });

  test('shows character counters', () => {
    const store = createMockStore({
      formBuilder: {
        formData: {
          title: 'Test',
          description: 'Test Desc'
        },
        TITLE_CHAR_LIMIT: 100,
        DESCRIPTION_CHAR_LIMIT: 500
      }
    });

    render(
      <Provider store={store}>
        <FormConfig onSaveAsDraft={mockOnSaveAsDraft} onNext={mockOnNext} />
      </Provider>
    );

    expect(screen.getByText('4/100')).toBeInTheDocument();
    expect(screen.getByText('9/500')).toBeInTheDocument();
  });
});
