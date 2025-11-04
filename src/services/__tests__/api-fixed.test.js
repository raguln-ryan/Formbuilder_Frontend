// CORRECT TEST FILE - Copy this exactly
import axios from 'axios';

// Mock ONLY external dependencies
jest.mock('axios');

// Clear module cache to ensure fresh import
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

// Import the actual file AFTER mocking axios
const getApi = () => {
  return require('../api').default;
};

describe('API Service - Fixed', () => {
  let api;
  
  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    
    // Mock window.location
    delete window.location;
    window.location = { href: '' };
    
    // Setup axios mock
    const mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn((success) => {
            // Test the request interceptor
            const config = { headers: {} };
            global.localStorage.getItem.mockReturnValue('test-token');
            success(config);
          })
        },
        response: {
          use: jest.fn((success, error) => {
            // Test the response interceptor
            const response = { data: 'test' };
            success(response);
            
            const err = {
              response: { status: 401 },
              config: { url: '/some-endpoint' }
            };
            error(err).catch(() => {});
          })
        }
      }
    };
    
    axios.create.mockReturnValue(mockAxiosInstance);
    
    // Import api AFTER setting up mocks
    api = getApi();
  });
  
  test('api service loads and creates axios instance', () => {
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:5150/api',
      headers: {
        'Content-Type': 'application/json',
      }
    });
  });
});