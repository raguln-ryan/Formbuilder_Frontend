import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal Component', () => {
  test('does not render when isOpen is false', () => {
    render(<Modal isOpen={false} onClose={() => {}} onConfirm={() => {}} />);
    expect(screen.queryByText('Delete Form')).not.toBeInTheDocument();
  });

  test('renders when isOpen is true', () => {
    render(<Modal isOpen={true} onClose={() => {}} onConfirm={() => {}} />);
    expect(screen.getByText('Delete Form')).toBeInTheDocument();
  });

  test('renders with custom title and message', () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={() => {}} 
        title="Custom Title"
        message="Custom message text"
      />
    );
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom message text')).toBeInTheDocument();
  });

  test('renders delete type modal by default', () => {
    render(<Modal isOpen={true} onClose={() => {}} onConfirm={() => {}} />);
    
    expect(screen.getByText('Delete Form')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this form/)).toBeInTheDocument();
    expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
  });

  test('renders publish type modal', () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={() => {}} 
        type="publish"
      />
    );
    
    expect(screen.getByText('Publish Form')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to publish this form/)).toBeInTheDocument();
    expect(screen.getByText('Yes, Publish')).toBeInTheDocument();
  });

  test('renders clear type modal', () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={() => {}} 
        type="clear"
      />
    );
    
    expect(screen.getByText('Clear Form')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to clear all the information/)).toBeInTheDocument();
    expect(screen.getByText('Yes, Clear')).toBeInTheDocument();
  });

  test('renders submitted type modal with date', () => {
    const lastDate = '2024-01-15T10:30:00Z';
    render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={() => {}} 
        type="submitted"
        lastSubmissionDate={lastDate}
      />
    );
    
    expect(screen.getByText('Form Already Submitted')).toBeInTheDocument();
    expect(screen.getByText(/You last submitted this form on/)).toBeInTheDocument();
    expect(screen.getByText('Yes, Continue')).toBeInTheDocument();
  });

  test('renders submitted type modal without date', () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={() => {}} 
        type="submitted"
      />
    );
    
    expect(screen.getByText(/You last submitted this form on recently/)).toBeInTheDocument();
  });

  test('calls onClose when close button clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal 
        isOpen={true} 
        onClose={handleClose} 
        onConfirm={() => {}} 
      />
    );
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when cancel button clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal 
        isOpen={true} 
        onClose={handleClose} 
        onConfirm={() => {}} 
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('calls onConfirm when confirm button clicked', () => {
    const handleConfirm = jest.fn();
    render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={handleConfirm} 
      />
    );
    
    const confirmButton = screen.getByText('Yes, Delete');
    fireEvent.click(confirmButton);
    
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when clicking overlay', () => {
    const handleClose = jest.fn();
    render(
      <Modal 
        isOpen={true} 
        onClose={handleClose} 
        onConfirm={() => {}} 
      />
    );
    
    const overlay = screen.getByText('Delete Form').parentElement.parentElement.parentElement;
    fireEvent.click(overlay);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('stops propagation when clicking modal content', () => {
    const handleClose = jest.fn();
    render(
      <Modal 
        isOpen={true} 
        onClose={handleClose} 
        onConfirm={() => {}} 
      />
    );
    
    const modalContent = screen.getByText('Delete Form').parentElement.parentElement;
    fireEvent.click(modalContent);
    
    expect(handleClose).not.toHaveBeenCalled();
  });

  test('uses custom confirm and cancel text', () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={() => {}} 
        confirmText="Custom Confirm"
        cancelText="Custom Cancel"
      />
    );
    
    expect(screen.getByText('Custom Confirm')).toBeInTheDocument();
    expect(screen.getByText('Custom Cancel')).toBeInTheDocument();
  });

  test('applies correct CSS classes for different types', () => {
    const { rerender, container } = render(
      <Modal isOpen={true} onClose={() => {}} onConfirm={() => {}} type="delete" />
    );
    expect(container.querySelector('.modal-delete')).toBeInTheDocument();
    expect(screen.getByText('Yes, Delete')).toHaveClass('confirm-btn', 'delete');
    
    rerender(
      <Modal isOpen={true} onClose={() => {}} onConfirm={() => {}} type="publish" />
    );
    expect(container.querySelector('.modal-publish')).toBeInTheDocument();
    expect(screen.getByText('Yes, Publish')).toHaveClass('confirm-btn', 'publish');
    
    rerender(
      <Modal isOpen={true} onClose={() => {}} onConfirm={() => {}} type="clear" />
    );
    expect(container.querySelector('.modal-clear')).toBeInTheDocument();
    expect(screen.getByText('Yes, Clear')).toHaveClass('confirm-btn', 'clear');
    
    rerender(
      <Modal isOpen={true} onClose={() => {}} onConfirm={() => {}} type="submitted" />
    );
    expect(container.querySelector('.modal-submitted')).toBeInTheDocument();
    expect(screen.getByText('Yes, Continue')).toHaveClass('confirm-btn', 'submitted');
  });
});