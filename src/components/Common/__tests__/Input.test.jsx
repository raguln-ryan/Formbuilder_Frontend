import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../Input';

describe('Input Component', () => {
  test('renders text input by default', () => {
    render(<Input value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
  });

  test('renders with label', () => {
    render(<Input label="Email" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  test('shows required asterisk when required', () => {
    render(<Input label="Email" required value="" onChange={() => {}} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input value="test" onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  test('renders different input types', () => {
    const { rerender } = render(<Input type="email" value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    
    rerender(<Input type="password" value="" onChange={() => {}} />);
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password');
    
    rerender(<Input type="number" value="" onChange={() => {}} />);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
  });

  test('renders textarea when type is textarea', () => {
    render(<Input type="textarea" value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
  });

  test('renders select when type is select', () => {
    render(
      <Input type="select" value="" onChange={() => {}}>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Input>
    );
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  test('shows placeholder text', () => {
    render(<Input placeholder="Enter your name" value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  test('disables input when disabled prop is true', () => {
    render(<Input disabled value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  test('shows error message and applies error class', () => {
    render(<Input error="This field is required" value="" onChange={() => {}} />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('input-error');
  });

  test('applies custom className', () => {
    render(<Input className="custom-input" value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox').parentElement).toHaveClass('custom-input');
  });

  test('passes additional props to input', () => {
    render(<Input maxLength={10} value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '10');
  });

  test('generates unique id for label association', () => {
    const { container } = render(<Input label="Test Label" value="" onChange={() => {}} />);
    
    const label = screen.getByText('Test Label');
    const input = screen.getByRole('textbox');
    
    expect(label).toHaveAttribute('for');
    expect(input).toHaveAttribute('id');
    expect(label.getAttribute('for')).toBe(input.getAttribute('id'));
  });
});