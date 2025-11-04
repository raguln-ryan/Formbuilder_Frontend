// Add act wrapper for state updates
import { render, screen, waitFor, act } from '@testing-library/react';

// Wrap state updates in act
test('login function stores data and updates state', async () => {
  localStorageMock.getItem.mockReturnValue(null);
  
  const { getByText } = render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
  });

  await act(async () => {
    getByText('Login').click();
  });

  await waitFor(() => {
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token');
  });
});