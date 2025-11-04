// Remove vitest import - Jest provides these as globals
import axios from 'axios';
import api from '../api';

// Mock axios
jest.mock('axios');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock window.location
delete window.location;
window.location = { href: jest.fn() };

describe('api service', () => {
  let mockInstance;
  let requestInterceptor;
  let responseInterceptor;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock axios instance
    mockInstance = {
      interceptors: {
        request: {
          use: jest.fn((successFn, errorFn) => {
            requestInterceptor = { success: successFn, error: errorFn };
            return 1;
          })
        },
        response: {
          use: jest.fn((successFn, errorFn) => {
            responseInterceptor = { success: successFn, error: errorFn };
            return 1;
          })
        }
      }
    };

    axios.create.mockReturnValue(mockInstance);

    // Re-import to trigger axios.create
    jest.isolateModules(() => {
      require('../api');
    });
  });

  test('creates axios instance with correct config', () => {
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:5150/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  test('request interceptor adds token when available', () => {
    localStorageMock.getItem.mockReturnValue('test-token');
    
    const config = { headers: {} };
    const result = requestInterceptor.success(config);
    
    expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
    expect(result.headers.Authorization).toBe('Bearer test-token');
  });

  test('request interceptor works without token', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const config = { headers: {} };
    const result = requestInterceptor.success(config);
    
    expect(result.headers.Authorization).toBeUndefined();
  });

  test('request interceptor handles error', async () => {
    const error = new Error('Request error');
    
    await expect(requestInterceptor.error(error)).rejects.toThrow('Request error');
  });

  test('response interceptor returns successful response', () => {
    const response = { data: 'test data' };
    const result = responseInterceptor.success(response);
    
    expect(result).toBe(response);
  });

  test('response interceptor handles 401 for non-login endpoints', async () => {
    const error = {
      response: { status: 401 },
      config: { url: '/user/profile' }
    };
    
    await expect(responseInterceptor.error(error)).rejects.toEqual(error);
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    expect(window.location.href).toBe('/login');
  });

  test('response interceptor ignores 401 for login endpoint', async () => {
    const error = {
      response: { status: 401 },
      config: { url: '/auth/login' }
    };
    
    await expect(responseInterceptor.error(error)).rejects.toEqual(error);
    
    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    expect(window.location.href).not.toBe('/login');
  });

  test('response interceptor handles non-401 errors', async () => {
    const error = {
      response: { status: 500 },
      config: { url: '/some/endpoint' }
    };
    
    await expect(responseInterceptor.error(error)).rejects.toEqual(error);
    
    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    expect(window.location.href).not.toBe('/login');
  });

  test('response interceptor handles errors without response', async () => {
    const error = new Error('Network error');
    
    await expect(responseInterceptor.error(error)).rejects.toEqual(error);
    
    expect(localStorageMock.removeItem).not.toHaveBeenCalled();
  });
});