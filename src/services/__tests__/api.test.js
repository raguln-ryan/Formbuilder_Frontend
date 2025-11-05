import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Import the actual api module
import api from '../api';

describe('api service', () => {
  let mock;
  
  beforeAll(() => {
    // Create a mock adapter on the api instance
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    // Reset the mock after each test
    mock.reset();
    localStorage.clear();
  });

  afterAll(() => {
    // Restore the mock
    mock.restore();
  });

  describe('API configuration', () => {
    it('should have correct base URL', () => {
      expect(api.defaults.baseURL).toBe('http://localhost:5150/api');
    });

    it('should have correct default headers', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Request interceptor', () => {
    it('should add authorization header when token exists', async () => {
      localStorage.setItem('token', 'test-token-123');
      mock.onGet('/test').reply(200, { data: 'test' });

      const response = await api.get('/test');
      
      expect(mock.history.get[0].headers.Authorization).toBe('Bearer test-token-123');
      expect(response.data).toEqual({ data: 'test' });
    });

    it('should not add authorization header when token does not exist', async () => {
      localStorage.removeItem('token');
      mock.onGet('/test').reply(200, { data: 'test' });

      await api.get('/test');
      
      expect(mock.history.get[0].headers.Authorization).toBeUndefined();
    });

    it('should handle multiple requests with token', async () => {
      localStorage.setItem('token', 'token-456');
      mock.onGet('/test1').reply(200);
      mock.onPost('/test2').reply(200);

      await api.get('/test1');
      await api.post('/test2', {});
      
      expect(mock.history.get[0].headers.Authorization).toBe('Bearer token-456');
      expect(mock.history.post[0].headers.Authorization).toBe('Bearer token-456');
    });

    it('should handle request error', async () => {
      mock.onGet('/test').networkError();

      await expect(api.get('/test')).rejects.toThrow('Network Error');
    });
  });

  describe('Response interceptor', () => {
    const originalLocation = window.location.href;

    beforeEach(() => {
      delete window.location;
      window.location = { href: originalLocation };
    });

    afterEach(() => {
      window.location.href = originalLocation;
    });

    it('should pass through successful responses', async () => {
      mock.onGet('/test').reply(200, { success: true });

      const response = await api.get('/test');
      
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true });
    });

    it('should redirect to login on 401 for non-login requests', async () => {
      localStorage.setItem('token', 'old-token');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));
      
      mock.onGet('/api/protected').reply(401);

      try {
        await api.get('/api/protected');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(window.location.href).toBe('/login');
    });

    it('should not redirect on 401 for login requests', async () => {
      const originalHref = window.location.href;
      mock.onPost('/auth/login').reply(401, { message: 'Invalid credentials' });

      try {
        await api.post('/auth/login', { username: 'test', password: 'wrong' });
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.message).toBe('Invalid credentials');
      }

      expect(window.location.href).toBe(originalHref);
    });

    it('should handle other error statuses without redirect', async () => {
      const originalHref = window.location.href;
      mock.onGet('/test').reply(500, { error: 'Server error' });

      try {
        await api.get('/test');
      } catch (error) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.error).toBe('Server error');
      }

      expect(window.location.href).toBe(originalHref);
    });

    it('should handle 404 errors', async () => {
      mock.onGet('/not-found').reply(404);

      try {
        await api.get('/not-found');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }

      expect(window.location.href).not.toBe('/login');
    });

    it('should handle network errors without response object', async () => {
      mock.onGet('/test').networkError();

      try {
        await api.get('/test');
      } catch (error) {
        expect(error.message).toBe('Network Error');
        expect(error.response).toBeUndefined();
      }

      expect(window.location.href).not.toBe('/login');
    });

    it('should handle timeout errors', async () => {
      mock.onGet('/test').timeout();

      try {
        await api.get('/test');
      } catch (error) {
        expect(error.code).toBe('ECONNABORTED');
      }

      expect(window.location.href).not.toBe('/login');
    });

    it('should handle 401 with various URL patterns', async () => {
      localStorage.setItem('token', 'token');
      localStorage.setItem('user', 'user');
      
      // Test different URL patterns
      mock.onGet('/users/profile').reply(401);
      
      try {
        await api.get('/users/profile');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }

      expect(localStorage.getItem('token')).toBeNull();
      expect(window.location.href).toBe('/login');
    });

    it('should not redirect for auth/login in URL path', async () => {
      const originalHref = window.location.href;
      mock.onPost('/v1/auth/login').reply(401);

      try {
        await api.post('/v1/auth/login', {});
      } catch (error) {
        expect(error.response.status).toBe(401);
      }

      expect(window.location.href).toBe(originalHref);
    });
  });

  describe('Different HTTP methods', () => {
    it('should work with GET requests', async () => {
      mock.onGet('/test').reply(200, { method: 'GET' });
      
      const response = await api.get('/test');
      expect(response.data.method).toBe('GET');
    });

    it('should work with POST requests', async () => {
      mock.onPost('/test').reply(201, { method: 'POST' });
      
      const response = await api.post('/test', { data: 'test' });
      expect(response.data.method).toBe('POST');
    });

    it('should work with PUT requests', async () => {
      mock.onPut('/test').reply(200, { method: 'PUT' });
      
      const response = await api.put('/test', { data: 'test' });
      expect(response.data.method).toBe('PUT');
    });

    it('should work with DELETE requests', async () => {
      mock.onDelete('/test').reply(204);
      
      const response = await api.delete('/test');
      expect(response.status).toBe(204);
    });

    it('should work with PATCH requests', async () => {
      mock.onPatch('/test').reply(200, { method: 'PATCH' });
      
      const response = await api.patch('/test', { data: 'test' });
      expect(response.data.method).toBe('PATCH');
    });
  });
});
