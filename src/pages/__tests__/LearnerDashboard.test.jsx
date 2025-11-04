import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LearnerDashboard from '../LearnerDashboard';

jest.mock('../../components/Learner/PublishedFormList', () => {
  return function MockPublishedFormList() {
    return <div>PublishedFormList Component</div>;
  };
});

describe('LearnerDashboard', () => {
  test('renders PublishedFormList component', () => {
    render(
      <BrowserRouter>
        <LearnerDashboard />
      </BrowserRouter>
    );
    
    expect(screen.getByText('PublishedFormList Component')).toBeInTheDocument();
  });
});