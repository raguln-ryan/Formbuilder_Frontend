import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../Input';

describe('Input', () => {
  test('renders input with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  test('renders required asterisk when required', () => {
    render(<Input label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('renders textarea when type is textarea', () => {
    render(<Input type="textarea" label="Description" />);
    expect(screen.getByLabelText('Description').tagName).toBe('TEXTAREA');
  });

  test('renders select when type is select', () => {
    render(
      <Input type="select" label="Country">
        <option value="us">US</option>
        <option value="uk">UK</option>
      </Input>
    );
    expect(screen.getByLabelText('Country').tagName).toBe('SELECT');
  });

  test('handles value and onChange for input', () => {
    const handleChange = jest.fn();
    render(<Input value="test" onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalled();
  });

  test('shows error message', () => {
    render(<Input error="Email is required" />);
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  test('applies error class when error exists', () => {
    render(<Input error="Error" />);
    expect(screen.getByRole('textbox')).toHaveClass('input-error');
  });

  test('disables input when disabled prop is true', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  test('applies custom className', () => {
    render(<Input className="custom-input" />);
    expect(document.querySelector('.custom-input')).toBeInTheDocument();
  });

  test('passes placeholder prop', () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  test('passes additional props', () => {
    render(<Input maxLength={10} data-testid="test-input" />);
    const input = screen.getByRole('textbox');
    
    expect(input).toHaveAttribute('maxLength', '10');
    expect(input).toHaveAttribute('data-testid', 'test-input');
  });

  test('generates unique id for label association', () => {
    render(<Input label="Test Label" />);
    const input = screen.getByLabelText('Test Label');
    expect(input.id).toBeTruthy();
  });
});