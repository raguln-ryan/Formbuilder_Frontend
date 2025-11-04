import authService from '../authService';
import api from '../api';

jest.mock('../api');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    test('successful login', async () => {
      const credentials = { email: 'test@test.com', password: 'password123' };
      const mockResponse = {
        data: {
          token: 'test-token',
          userId: '123',
          name: 'Test User',
          role: 'Admin'
        }
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await authService.login(credentials);

      expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockResponse.data);
    });

    test('login error handling', async () => {
      const credentials = { email: 'test@test.com', password: 'wrong' };
      const error = new Error('Invalid credentials');

      api.post.mockRejectedValue(error);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
      
      expect(consoleSpy).toHaveBeenCalledWith('Login error:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('register', () => {
    test('successful registration', async () => {
      const userData = {
        name: 'New User',
        email: 'new@test.com',
        password: 'Password123'
      };
      const mockResponse = {
        data: {
          token: 'new-token',
          userId: '456',
          name: 'New User',
          role: 'Learner'
        }
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await authService.register(userData);

      expect(api.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result).toEqual(mockResponse.data);
    });

    test('registration error handling', async () => {
      const userData = {
        name: 'Test',
        email: 'existing@test.com',
        password: 'Pass123'
      };
      const error = new Error('Email already exists');

      api.post.mockRejectedValue(error);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(authService.register(userData)).rejects.toThrow('Email already exists');
      
      expect(consoleSpy).toHaveBeenCalledWith('Registration error:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('logout', () => {
    test('clears localStorage on logout', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ name: 'Test' }));

      authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});