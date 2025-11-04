import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button Component', () => {
  test('renders button with children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click Me');
  });

  test('applies primary variant by default', () => {
    render(<Button>Primary Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary');
  });

  test('applies different variants', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
    
    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-danger');
  });

  test('applies different sizes', () => {
    const { rerender } = render(<Button size="small">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-small');
    
    rerender(<Button size="large">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-large');
    
    rerender(<Button>Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-medium');
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('disables button when disabled prop is true', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-loading');
    expect(button).toBeDisabled();
    expect(button.querySelector('.btn-spinner')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  test('passes additional props', () => {
    render(<Button data-testid="test-button" type="submit">Submit</Button>);
    
    const button = screen.getByTestId('test-button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  test('prevents click when loading', () => {
    const handleClick = jest.fn();
    render(<Button loading onClick={handleClick}>Loading</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});