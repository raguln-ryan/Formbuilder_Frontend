import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn()
  };

  test('does not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders delete modal by default', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Delete Form')).toBeInTheDocument();
    expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
  });

  test('renders publish modal', () => {
    render(<Modal {...defaultProps} type="publish" />);
    expect(screen.getByText('Publish Form')).toBeInTheDocument();
    expect(screen.getByText('Yes, Publish')).toBeInTheDocument();
  });

  test('renders clear modal', () => {
    render(<Modal {...defaultProps} type="clear" />);
    expect(screen.getByText('Clear Form')).toBeInTheDocument();
    expect(screen.getByText('Yes, Clear')).toBeInTheDocument();
  });

  test('renders submitted modal with date', () => {
    const date = '2024-01-15T10:00:00Z';
    render(<Modal {...defaultProps} type="submitted" lastSubmissionDate={date} />);
    expect(screen.getByText('Form Already Submitted')).toBeInTheDocument();
    expect(screen.getByText(/15\/01\/2024/)).toBeInTheDocument();
  });

  test('uses custom title and message', () => {
    render(<Modal {...defaultProps} title="Custom Title" message="Custom Message" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Message')).toBeInTheDocument();
  });

  test('uses custom button texts', () => {
    render(<Modal {...defaultProps} confirmText="Confirm" cancelText="Abort" />);
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Abort')).toBeInTheDocument();
  });

  test('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    
    fireEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalled();
  });

  test('calls onClose when cancel button clicked', () => {
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  test('calls onConfirm when confirm button clicked', () => {
    const onConfirm = jest.fn();
    render(<Modal {...defaultProps} onConfirm={onConfirm} />);
    
    fireEvent.click(screen.getByText('Yes, Delete'));
    expect(onConfirm).toHaveBeenCalled();
  });

  test('calls onClose when overlay clicked', () => {
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    
    fireEvent.click(document.querySelector('.modal-overlay'));
    expect(onClose).toHaveBeenCalled();
  });

  test('stops propagation when modal content clicked', () => {
    const onClose = jest.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    
    const modalContent = document.querySelector('.modal-content');
    const event = new MouseEvent('click', { bubbles: true });
    jest.spyOn(event, 'stopPropagation');
    
    fireEvent(modalContent, event);
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  test('formats date correctly for submitted modal', () => {
    render(<Modal {...defaultProps} type="submitted" lastSubmissionDate={null} />);
    expect(screen.getByText(/recently/)).toBeInTheDocument();
  });
});