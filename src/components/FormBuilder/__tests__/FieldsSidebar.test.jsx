import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FieldsSidebar from '../FieldsSidebar';

describe('FieldsSidebar Component', () => {
  const mockOnFieldDragStart = jest.fn();

  beforeEach(() => {
    mockOnFieldDragStart.mockClear();
  });

  test('renders with input fields tab active by default', () => {
    render(<FieldsSidebar />);
    
    const inputTab = screen.getByRole('button', { name: /input fields/i });
    expect(inputTab).toHaveClass('active');
    
    // Check if input field types are visible
    expect(screen.getByText('Short Text')).toBeInTheDocument();
    expect(screen.getByText('Long Text')).toBeInTheDocument();
    expect(screen.getByText('Date Picker')).toBeInTheDocument();
    expect(screen.getByText('Dropdown')).toBeInTheDocument();
    expect(screen.getByText('File Upload')).toBeInTheDocument();
    expect(screen.getByText('Number')).toBeInTheDocument();
  });

  test('switches to UDF fields tab when clicked', () => {
    render(<FieldsSidebar />);
    
    const udfTab = screen.getByRole('button', { name: /udf fields/i });
    fireEvent.click(udfTab);
    
    expect(udfTab).toHaveClass('active');
    
    // Check if UDF field types are visible
    expect(screen.getByText('UDF Text')).toBeInTheDocument();
    expect(screen.getByText('UDF Select')).toBeInTheDocument();
    expect(screen.getByText('UDF Date')).toBeInTheDocument();
    expect(screen.getByText('UDF Number')).toBeInTheDocument();
  });

  test('switches back to input fields tab', () => {
    render(<FieldsSidebar />);
    
    // First switch to UDF
    const udfTab = screen.getByRole('button', { name: /udf fields/i });
    fireEvent.click(udfTab);
    
    // Then switch back to Input
    const inputTab = screen.getByRole('button', { name: /input fields/i });
    fireEvent.click(inputTab);
    
    expect(inputTab).toHaveClass('active');
    expect(screen.getByText('Short Text')).toBeInTheDocument();
  });

  test('handles drag start for input field types', () => {
    render(<FieldsSidebar onFieldDragStart={mockOnFieldDragStart} />);
    
    const shortTextField = screen.getByText('Short Text').closest('.field-type-item');
    
    const dataTransfer = {
      setData: jest.fn(),
      effectAllowed: ''
    };
    
    const dragEvent = new DragEvent('dragstart', { dataTransfer });
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: dataTransfer
    });
    
    fireEvent.dragStart(shortTextField, dragEvent);
    
    expect(dataTransfer.setData).toHaveBeenCalled();
    expect(dataTransfer.effectAllowed).toBe('copy');
    expect(mockOnFieldDragStart).toHaveBeenCalled();
  });

  test('handles drag start for all field types', () => {
    render(<FieldsSidebar onFieldDragStart={mockOnFieldDragStart} />);
    
    const fieldTypes = ['Short Text', 'Long Text', 'Date Picker', 'Dropdown', 'File Upload', 'Number'];
    
    fieldTypes.forEach(fieldType => {
      const field = screen.getByText(fieldType).closest('.field-type-item');
      
      const dataTransfer = {
        setData: jest.fn(),
        effectAllowed: ''
      };
      
      fireEvent.dragStart(field, { dataTransfer });
    });
    
    expect(mockOnFieldDragStart).toHaveBeenCalledTimes(6);
  });

  test('renders field icons with correct background colors', () => {
    const { container } = render(<FieldsSidebar />);
    
    const iconWrappers = container.querySelectorAll('.field-icon-wrapper');
    expect(iconWrappers.length).toBeGreaterThan(0);
    
    // Check if background colors are applied
    iconWrappers.forEach(wrapper => {
      expect(wrapper.style.backgroundColor).toBeTruthy();
    });
  });

  test('disables drag when formId is provided', () => {
    render(<FieldsSidebar formId="123" onFieldDragStart={mockOnFieldDragStart} />);
    
    const shortTextField = screen.getByText('Short Text').closest('.field-type-item');
    
    const dataTransfer = {
      setData: jest.fn(),
      effectAllowed: ''
    };
    
    fireEvent.dragStart(shortTextField, { dataTransfer });
    
    // Should not call onFieldDragStart when disabled
    expect(mockOnFieldDragStart).not.toHaveBeenCalled();
  });

  test('applies disabled class when formId is provided', () => {
    const { container } = render(<FieldsSidebar formId="123" />);
    
    expect(container.querySelector('.fields-sidebar')).toHaveClass('disabled');
  });

  test('renders all input field types with correct icons', () => {
    const { container } = render(<FieldsSidebar />);
    
    const fieldIcons = container.querySelectorAll('.field-icon');
    expect(fieldIcons.length).toBe(6); // 6 input field types
    
    fieldIcons.forEach(icon => {
      expect(icon).toHaveAttribute('alt');
      expect(icon).toHaveAttribute('src');
    });
  });

  test('renders all UDF field types with correct icons', () => {
    const { container } = render(<FieldsSidebar />);
    
    const udfTab = screen.getByRole('button', { name: /udf fields/i });
    fireEvent.click(udfTab);
    
    const fieldIcons = container.querySelectorAll('.field-icon');
    expect(fieldIcons.length).toBe(4); // 4 UDF field types
  });

  test('does not call onFieldDragStart when not provided', () => {
    render(<FieldsSidebar />);
    
    const shortTextField = screen.getByText('Short Text').closest('.field-type-item');
    
    const dataTransfer = {
      setData: jest.fn(),
      effectAllowed: ''
    };
    
    // Should not throw error when onFieldDragStart is not provided
    expect(() => {
      fireEvent.dragStart(shortTextField, { dataTransfer });
    }).not.toThrow();
  });
});