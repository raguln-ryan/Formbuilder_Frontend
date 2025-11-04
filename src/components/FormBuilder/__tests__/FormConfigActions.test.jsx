import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FormConfigActions from '../FormConfigActions';

describe('FormConfigActions Component', () => {
  const mockOnSaveAsDraft = jest.fn();
  const mockOnNext = jest.fn();
  
  const defaultProps = {
    onSaveAsDraft: mockOnSaveAsDraft,
    onNext: mockOnNext,
    saving: false,
    isValid: true
  };

  beforeEach(() => {
    mockOnSaveAsDraft.mockClear();
    mockOnNext.mockClear();
  });

  test('renders both action buttons', () => {
    render(<FormConfigActions {...defaultProps} />);
    
    expect(screen.getByText('Save as Draft')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  test('handles save as draft click', () => {
    render(<FormConfigActions {...defaultProps} />);
    
    const saveButton = screen.getByText('Save as Draft');
    fireEvent.click(saveButton);
    
    expect(mockOnSaveAsDraft).toHaveBeenCalledTimes(1);
  });

  test('handles next button click', () => {
    render(<FormConfigActions {...defaultProps} />);
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  test('disables buttons when form is invalid', () => {
    render(<FormConfigActions {...defaultProps} isValid={false} />);
    
    const saveButton = screen.getByText('Save as Draft');
    const nextButton = screen.getByText('Next');
    
    expect(saveButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  test('disables buttons when saving', () => {
    render(<FormConfigActions {...defaultProps} saving={true} />);
    
    const saveButton = screen.getByText('Save as Draft');
    const nextButton = screen.getByText('Next');
    
    expect(saveButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  test('enables buttons when valid and not saving', () => {
    render(<FormConfigActions {...defaultProps} />);
    
    const saveButton = screen.getByText('Save as Draft');
    const nextButton = screen.getByText('Next');
    
    expect(saveButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  test('applies correct CSS classes', () => {
    const { container } = render(<FormConfigActions {...defaultProps} />);
    
    expect(container.querySelector('.form-config-actions-floating')).toBeInTheDocument();
    expect(container.querySelector('.save-draft-btn')).toBeInTheDocument();
    expect(container.querySelector('.next-btn')).toBeInTheDocument();
  });
});