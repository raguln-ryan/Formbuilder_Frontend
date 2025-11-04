import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormConfig from '../FormConfig';
import toast from 'react-hot-toast';

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  dismiss: jest.fn()
}));

describe('FormConfig Component', () => {
  const mockOnInputChange = jest.fn();
  const mockOnSaveAsDraft = jest.fn();
  const mockOnNext = jest.fn();
  
  const defaultProps = {
    formData: {
      title: '',
      description: '',
      isVisible: false
    },
    onInputChange: mockOnInputChange,
    onSaveAsDraft: mockOnSaveAsDraft,
    onNext: mockOnNext,
    errors: {},
    saving: false,
    TITLE_CHAR_LIMIT: 80,
    DESCRIPTION_CHAR_LIMIT: 200
  };

  beforeEach(() => {
    mockOnInputChange.mockClear();
    mockOnSaveAsDraft.mockClear();
    mockOnNext.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
    toast.dismiss.mockClear();
  });

  test('renders form configuration fields', () => {
    render(<FormConfig {...defaultProps} />);
    
    expect(screen.getByText('Form Details')).toBeInTheDocument();
    expect(screen.getByLabelText(/form name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByText('Form Visibility')).toBeInTheDocument();
  });

  test('displays character counters', () => {
    render(<FormConfig {...defaultProps} />);
    
    expect(screen.getByText('0/80')).toBeInTheDocument();
    expect(screen.getByText('0/200')).toBeInTheDocument();
  });

  test('handles title input change', () => {
    render(<FormConfig {...defaultProps} />);
    
    const titleInput = screen.getByPlaceholderText('Enter Form Name');
    fireEvent.change(titleInput, { target: { value: 'Test Form' } });
    
    expect(mockOnInputChange).toHaveBeenCalledWith('title', 'Test Form');
  });

  test('handles description input change', () => {
    render(<FormConfig {...defaultProps} />);
    
    const descInput = screen.getByPlaceholderText("Summarize the form's purpose for internal reference.");
    fireEvent.change(descInput, { target: { value: 'Test Description' } });
    
    expect(mockOnInputChange).toHaveBeenCalledWith('description', 'Test Description');
  });

  test('handles visibility toggle', () => {
    render(<FormConfig {...defaultProps} />);
    
    const visibilityToggle = screen.getByRole('checkbox');
    fireEvent.click(visibilityToggle);
    
    expect(mockOnInputChange).toHaveBeenCalledWith('isVisible', true);
    expect(toast.success).toHaveBeenCalledWith('Form is now visible', expect.any(Object));
  });

  test('handles visibility toggle off', () => {
    const props = {
      ...defaultProps,
      formData: { ...defaultProps.formData, isVisible: true }
    };
    
    render(<FormConfig {...props} />);
    
    const visibilityToggle = screen.getByRole('checkbox');
    fireEvent.click(visibilityToggle);
    
    expect(mockOnInputChange).toHaveBeenCalledWith('isVisible', false);
    expect(toast.success).toHaveBeenCalledWith('Form is now hidden', expect.any(Object));
  });

  test('displays validation errors', () => {
    const props = {
      ...defaultProps,
      errors: {
        title: 'Title is required',
        description: 'Description is required'
      }
    };
    
    render(<FormConfig {...props} />);
    
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
  });

  test('disables buttons when form is invalid', () => {
    render(<FormConfig {...defaultProps} />);
    
    const saveButton = screen.getByRole('button', { name: /save as draft/i });
    const nextButton = screen.getByRole('button', { name: /next/i });
    
    expect(saveButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  test('enables buttons when form is valid', () => {
    const props = {
      ...defaultProps,
      formData: {
        title: 'Valid Title',
        description: 'Valid Description',
        isVisible: false
      }
    };
    
    render(<FormConfig {...props} />);
    
    const saveButton = screen.getByRole('button', { name: /save as draft/i });
    const nextButton = screen.getByRole('button', { name: /next/i });
    
    expect(saveButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  test('handles save as draft click', async () => {
    mockOnSaveAsDraft.mockResolvedValue();
    
    const props = {
      ...defaultProps,
      formData: {
        title: 'Valid Title',
        description: 'Valid Description',
        isVisible: false
      }
    };
    
    render(<FormConfig {...props} />);
    
    const saveButton = screen.getByRole('button', { name: /save as draft/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnSaveAsDraft).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Form saved as draft successfully!');
    });
  });

  test('handles save as draft error', async () => {
    mockOnSaveAsDraft.mockRejectedValue(new Error('Save failed'));
    
    const props = {
      ...defaultProps,
      formData: {
        title: 'Valid Title',
        description: 'Valid Description',
        isVisible: false
      }
    };
    
    render(<FormConfig {...props} />);
    
    const saveButton = screen.getByRole('button', { name: /save as draft/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save form as draft');
    });
  });

  test('handles next button click with valid form', () => {
    const props = {
      ...defaultProps,
      formData: {
        title: 'Valid Title',
        description: 'Valid Description',
        isVisible: false
      }
    };
    
    render(<FormConfig {...props} />);
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    
    expect(toast.success).toHaveBeenCalledWith('Moving to next step...');
    expect(mockOnNext).toHaveBeenCalled();
  });

  test('handles next button click with invalid form', () => {
    render(<FormConfig {...defaultProps} />);
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    
    expect(toast.error).toHaveBeenCalledWith('Please fill in all required fields');
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  test('shows validation toast for empty title', () => {
    render(<FormConfig {...defaultProps} />);
    
    const titleInput = screen.getByPlaceholderText('Enter Form Name');
    fireEvent.change(titleInput, { target: { value: '' } });
    
    expect(toast.error).toHaveBeenCalledWith('Form name is required', expect.any(Object));
  });

  test('dismisses validation toast for valid title', () => {
    render(<FormConfig {...defaultProps} />);
    
    const titleInput = screen.getByPlaceholderText('Enter Form Name');
    fireEvent.change(titleInput, { target: { value: 'Valid' } });
    
    expect(toast.dismiss).toHaveBeenCalledWith('title-validation');
  });

  test('disables inputs when formId is provided', () => {
    const props = {
      ...defaultProps,
      formId: '123'
    };
    
    render(<FormConfig {...props} />);
    
    const titleInput = screen.getByPlaceholderText('Enter Form Name');
    const descInput = screen.getByPlaceholderText("Summarize the form's purpose for internal reference.");
    const visibilityToggle = screen.getByRole('checkbox');
    
    expect(titleInput).toBeDisabled();
    expect(descInput).toBeDisabled();
    expect(visibilityToggle).toBeDisabled();
  });

  test('shows saving state on buttons', () => {
    const props = {
      ...defaultProps,
      saving: true,
      formData: {
        title: 'Valid Title',
        description: 'Valid Description',
        isVisible: false
      }
    };
    
    render(<FormConfig {...props} />);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  test('updates character counter as user types', () => {
    const props = {
      ...defaultProps,
      formData: {
        title: 'Test',
        description: 'Test Desc',
        isVisible: false
      }
    };
    
    render(<FormConfig {...props} />);
    
    expect(screen.getByText('4/80')).toBeInTheDocument();
    expect(screen.getByText('9/200')).toBeInTheDocument();
  });
});