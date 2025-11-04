import formService from '../formService';
import api from '../api';
import responseService from '../responseService';

jest.mock('../api');
jest.mock('../responseService');

describe('formService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('getAllForms', () => {
    test('fetches all forms successfully', async () => {
      const mockForms = { data: [{ id: 1, title: 'Form 1' }] };
      api.get.mockResolvedValue(mockForms);

      const result = await formService.getAllForms(0, 10);

      expect(api.get).toHaveBeenCalledWith('/Form?offset=0&limit=10');
      expect(result).toEqual(mockForms.data);
    });

    test('handles error when fetching forms', async () => {
      const error = new Error('Network error');
      api.get.mockRejectedValue(error);

      await expect(formService.getAllForms()).rejects.toThrow('Network error');
      expect(console.error).toHaveBeenCalledWith('Error fetching forms:', error);
    });
  });

  describe('getFormById', () => {
    test('fetches form by id successfully', async () => {
      const mockForm = { data: { id: 1, title: 'Form 1' } };
      api.get.mockResolvedValue(mockForm);

      const result = await formService.getFormById(1);

      expect(api.get).toHaveBeenCalledWith('/Form/1');
      expect(result).toEqual(mockForm.data);
    });

    test('handles error when fetching form by id', async () => {
      const error = new Error('Form not found');
      api.get.mockRejectedValue(error);

      await expect(formService.getFormById(999)).rejects.toThrow('Form not found');
      expect(console.error).toHaveBeenCalledWith('Error fetching form:', error);
    });
  });

  describe('createForm', () => {
    test('creates form successfully', async () => {
      const formData = { title: 'New Form', description: 'Test' };
      const mockResponse = { data: { id: 1, ...formData } };
      api.post.mockResolvedValue(mockResponse);

      const result = await formService.createForm(formData);

      expect(api.post).toHaveBeenCalledWith('/Form/FormConfig', formData);
      expect(result).toEqual(mockResponse.data);
    });

    test('handles error when creating form', async () => {
      const error = new Error('Creation failed');
      api.post.mockRejectedValue(error);

      await expect(formService.createForm({})).rejects.toThrow('Creation failed');
      expect(console.error).toHaveBeenCalledWith('Error creating form:', error);
    });
  });

  describe('updateFormConfig', () => {
    test('updates form config successfully', async () => {
      const formData = { title: 'Updated Form' };
      const mockResponse = { data: { id: 1, ...formData } };
      api.put.mockResolvedValue(mockResponse);

      const result = await formService.updateFormConfig(1, formData);

      expect(api.put).toHaveBeenCalledWith('/Form/FormConfig/1', formData);
      expect(result).toEqual(mockResponse.data);
    });

    test('handles error when updating form config', async () => {
      const error = new Error('Update failed');
      api.put.mockRejectedValue(error);

      await expect(formService.updateFormConfig(1, {})).rejects.toThrow('Update failed');
      expect(console.error).toHaveBeenCalledWith('Error updating form config:', error);
    });
  });

  describe('updateForm', () => {
    test('updates form layout successfully', async () => {
      const formData = {
        questions: [{ id: 1, text: 'Question 1' }]
      };
      const mockResponse = { data: { success: true } };
      api.put.mockResolvedValue(mockResponse);

      const result = await formService.updateForm('form-123', formData);

      expect(api.put).toHaveBeenCalledWith('/Form/Layout/form-123', formData);
      expect(result).toEqual(mockResponse.data);
      expect(console.log).toHaveBeenCalledWith('FormService: Data received:', formData);
      expect(console.log).toHaveBeenCalledWith('FormService: Questions being sent:', formData.questions);
      expect(console.log).toHaveBeenCalledWith('FormService: Response from backend:', mockResponse.data);
    });
  });

  describe('deleteForm', () => {
    test('deletes form successfully with status 200', async () => {
      const mockResponse = { 
        status: 200, 
        data: { message: 'Form deleted' } 
      };
      api.delete.mockResolvedValue(mockResponse);

      const result = await formService.deleteForm('form-123');

      expect(api.delete).toHaveBeenCalledWith('/Form/form-123');
      expect(result).toEqual({
        success: true,
        message: 'Form deleted'
      });
      expect(console.log).toHaveBeenCalledWith('🗑️ Attempting to delete form:', 'form-123');
      expect(console.log).toHaveBeenCalledWith('✅ Delete response:', mockResponse);
    });

    test('deletes form successfully with status 204', async () => {
      const mockResponse = { status: 204 };
      api.delete.mockResolvedValue(mockResponse);

      const result = await formService.deleteForm('form-123');

      expect(result).toEqual({
        success: true,
        message: 'Form deleted successfully'
      });
    });

    test('handles delete error with response data', async () => {
      const error = {
        response: {
          data: {
            message: 'Cannot delete form with responses'
          }
        }
      };
      api.delete.mockRejectedValue(error);

      await expect(formService.deleteForm('form-123')).rejects.toThrow('Cannot delete form with responses');
      expect(console.error).toHaveBeenCalledWith('❌ Delete error:', error);
    });

    test('handles delete error with string response', async () => {
      const error = {
        response: {
          data: 'Delete failed'
        }
      };
      api.delete.mockRejectedValue(error);

      await expect(formService.deleteForm('form-123')).rejects.toThrow('Delete failed');
    });

    test('handles delete error without response data', async () => {
      const error = new Error('Network error');
      api.delete.mockRejectedValue(error);

      await expect(formService.deleteForm('form-123')).rejects.toThrow('Network error');
    });

    test('handles unexpected response status', async () => {
      const mockResponse = { status: 500 };
      api.delete.mockResolvedValue(mockResponse);

      await expect(formService.deleteForm('form-123')).rejects.toThrow('Unexpected response status');
    });
  });

  describe('publishForm', () => {
    test('publishes form successfully', async () => {
      const mockResponse = { data: { published: true } };
      api.put.mockResolvedValue(mockResponse);

      const result = await formService.publishForm('form-123');

      expect(api.put).toHaveBeenCalledWith('/Form/form-123/publish');
      expect(result).toEqual(mockResponse.data);
    });

    test('handles error when publishing form', async () => {
      const error = new Error('Publish failed');
      api.put.mockRejectedValue(error);

      await expect(formService.publishForm('form-123')).rejects.toThrow('Publish failed');
      expect(console.error).toHaveBeenCalledWith('Error publishing form:', error);
    });
  });

  describe('toggleFormStatus', () => {
    test('toggles form status successfully', async () => {
      const mockResponse = { data: { isEnabled: true } };
      api.put.mockResolvedValue(mockResponse);

      const result = await formService.toggleFormStatus('form-123', true);

      expect(api.put).toHaveBeenCalledWith('/Form/form-123/toggle', { isEnabled: true });
      expect(result).toEqual(mockResponse.data);
    });

    test('handles error when toggling form status', async () => {
      const error = new Error('Toggle failed');
      api.put.mockRejectedValue(error);

      await expect(formService.toggleFormStatus('form-123', false)).rejects.toThrow('Toggle failed');
      expect(console.error).toHaveBeenCalledWith('Error toggling form status:', error);
    });
  });

  describe('getFormResponses', () => {
    test('gets form responses successfully', async () => {
      const mockResponses = [{ id: 1, userId: 'user1' }];
      responseService.getFormResponses.mockResolvedValue(mockResponses);

      const result = await formService.getFormResponses('form-123');

      expect(responseService.getFormResponses).toHaveBeenCalledWith('form-123');
      expect(result).toEqual(mockResponses);
    });

    test('handles error and returns empty array', async () => {
      const error = new Error('Fetch failed');
      responseService.getFormResponses.mockRejectedValue(error);

      const result = await formService.getFormResponses('form-123');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error fetching form responses:', error);
    });
  });
});