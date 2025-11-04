import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  test('renders with default message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders with custom message', () => {
    render(<LoadingSpinner message="Please wait" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });

  test('renders spinner element', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  test('renders container with correct class', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.loading-spinner-container')).toBeInTheDocument();
  });

  test('renders message with correct class', () => {
    render(<LoadingSpinner message="Custom loading" />);
    const message = screen.getByText('Custom loading');
    expect(message).toHaveClass('loading-message');
  });
});