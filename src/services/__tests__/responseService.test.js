import api from '../api';
import responseService from '../responseService';

jest.mock('../api');

describe('responseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.log = jest.fn();
    global.alert = jest.fn();
    localStorage.clear();
  });

  describe('getFormResponses', () => {
    it('should fetch form responses with default parameters', async () => {
      const mockData = { data: [{ id: 1 }], totalCount: 1 };
      api.get.mockResolvedValue({ data: mockData });

      const result = await responseService.getFormResponses('form123');

      expect(api.get).toHaveBeenCalledWith('response/form/form123/responses?page=1&size=10');
      expect(result).toEqual(mockData);
    });

    it('should fetch with custom page and size', async () => {
      const mockData = { data: [], totalCount: 0 };
      api.get.mockResolvedValue({ data: mockData });

      await responseService.getFormResponses('form123', 2, 20);

      expect(api.get).toHaveBeenCalledWith('response/form/form123/responses?page=2&size=20');
    });

    it('should include search parameter when provided', async () => {
      const mockData = { data: [], totalCount: 0 };
      api.get.mockResolvedValue({ data: mockData });

      await responseService.getFormResponses('form123', 1, 10, 'test search');

      expect(api.get).toHaveBeenCalledWith('response/form/form123/responses?page=1&size=10&search=test+search');
    });

    it('should trim search parameter', async () => {
      api.get.mockResolvedValue({ data: { data: [], totalCount: 0 } });

      await responseService.getFormResponses('form123', 1, 10, '  search  ');

      expect(api.get).toHaveBeenCalledWith('response/form/form123/responses?page=1&size=10&search=search');
    });

    it('should not include empty search parameter', async () => {
      api.get.mockResolvedValue({ data: { data: [], totalCount: 0 } });

      await responseService.getFormResponses('form123', 1, 10, '  ');

      expect(api.get).toHaveBeenCalledWith('response/form/form123/responses?page=1&size=10');
    });

    it('should handle API error', async () => {
      api.get.mockRejectedValue(new Error('API Error'));

      const result = await responseService.getFormResponses('form123');

      expect(console.error).toHaveBeenCalledWith('Error fetching form responses:', expect.any(Error));
      expect(result).toEqual({ data: [], totalCount: 0 });
    });
  });

  describe('getPublishedForms', () => {
    it('should fetch published forms with default parameters', async () => {
      const mockData = { data: [{ id: 1, title: 'Form 1' }] };
      api.get.mockResolvedValue({ data: mockData });

      const result = await responseService.getPublishedForms();

      expect(api.get).toHaveBeenCalledWith('response/published?page=1&size=10');
      expect(console.log).toHaveBeenCalledWith('Published forms:', mockData);
      expect(result).toEqual(mockData);
    });

    it('should fetch with custom parameters', async () => {
      api.get.mockResolvedValue({ data: {} });

      await responseService.getPublishedForms(3, 15, 'search term');

      expect(api.get).toHaveBeenCalledWith('response/published?page=3&size=15&search=search+term');
    });

    it('should trim search parameter', async () => {
      api.get.mockResolvedValue({ data: {} });

      await responseService.getPublishedForms(1, 10, '  test  ');

      expect(api.get).toHaveBeenCalledWith('response/published?page=1&size=10&search=test');
    });

    it('should not include empty search', async () => {
      api.get.mockResolvedValue({ data: {} });

      await responseService.getPublishedForms(1, 10, '');

      expect(api.get).toHaveBeenCalledWith('response/published?page=1&size=10');
    });

    it('should throw error on failure', async () => {
      const error = new Error('API Error');
      api.get.mockRejectedValue(error);

      await expect(responseService.getPublishedForms()).rejects.toThrow('API Error');
      expect(console.error).toHaveBeenCalledWith('Error fetching published forms:', error);
    });
  });

  describe('getFormById', () => {
    it('should fetch form by ID', async () => {
      const mockForm = { id: 'form123', title: 'Test Form' };
      api.get.mockResolvedValue({ data: mockForm });

      const result = await responseService.getFormById('form123');

      expect(api.get).toHaveBeenCalledWith('response/form/form123');
      expect(result).toEqual(mockForm);
    });

    it('should throw error on failure', async () => {
      const error = new Error('Not found');
      api.get.mockRejectedValue(error);

      await expect(responseService.getFormById('form123')).rejects.toThrow('Not found');
      expect(console.error).toHaveBeenCalledWith('Error fetching form details:', error);
    });
  });

  describe('submitResponse', () => {
    it('should submit form response', async () => {
      const formData = { formId: 'form123', answers: [] };
      const mockResponse = { id: 'response123', success: true };
      api.post.mockResolvedValue({ data: mockResponse });

      const result = await responseService.submitResponse(formData);

      expect(api.post).toHaveBeenCalledWith('/response', formData);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on failure', async () => {
      const error = new Error('Submit failed');
      api.post.mockRejectedValue(error);

      await expect(responseService.submitResponse({})).rejects.toThrow('Submit failed');
      expect(console.error).toHaveBeenCalledWith('Error submitting response:', error);
    });
  });

  describe('getMySubmissions', () => {
    it('should fetch my submissions with defaults', async () => {
      const mockData = { data: [{ id: 1 }], totalCount: 5 };
      api.get.mockResolvedValue({ data: mockData });

      const result = await responseService.getMySubmissions();

      expect(api.get).toHaveBeenCalledWith('response/my-submissions?page=1&size=10');
      expect(console.log).toHaveBeenCalledWith('My submissions from API:', mockData);
      expect(result).toEqual(mockData);
    });

    it('should fetch with custom parameters and search', async () => {
      api.get.mockResolvedValue({ data: {} });

      await responseService.getMySubmissions(2, 20, 'query');

      expect(api.get).toHaveBeenCalledWith('response/my-submissions?page=2&size=20&search=query');
    });

    it('should trim search parameter', async () => {
      api.get.mockResolvedValue({ data: {} });

      await responseService.getMySubmissions(1, 10, '  trimmed  ');

      expect(api.get).toHaveBeenCalledWith('response/my-submissions?page=1&size=10&search=trimmed');
    });

    it('should handle error and return default', async () => {
      api.get.mockRejectedValue(new Error('Failed'));

      const result = await responseService.getMySubmissions();

      expect(console.error).toHaveBeenCalledWith('Error fetching my submissions:', expect.any(Error));
      expect(result).toEqual({ data: [], totalCount: 0 });
    });
  });

  describe('getResponseDetails', () => {
    it('should fetch response details', async () => {
      const mockDetails = { id: 'resp123', attachments: [] };
      api.get.mockResolvedValue({ data: mockDetails });

      const result = await responseService.getResponseDetails('resp123');

      expect(api.get).toHaveBeenCalledWith('response/resp123/details');
      expect(result).toEqual(mockDetails);
    });

    it('should throw error on failure', async () => {
      const error = new Error('Details not found');
      api.get.mockRejectedValue(error);

      await expect(responseService.getResponseDetails('resp123')).rejects.toThrow('Details not found');
      expect(console.error).toHaveBeenCalledWith('Error fetching response details:', error);
    });
  });

  describe('exportToCSV', () => {
    beforeEach(() => {
      global.URL.createObjectURL = jest.fn(() => 'blob:url');
      global.URL.revokeObjectURL = jest.fn();
      global.Blob = jest.fn((content, options) => ({ content, options }));
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();
    });

    it('should export responses to CSV', async () => {
      const mockResponses = {
        data: [
          {
            id: 'resp1',
            userId: 'user1',
            user: { name: 'John Doe', email: 'john@test.com' },
            submittedAt: '2024-01-01T10:00:00Z',
            status: 'Completed'
          },
          {
            id: 'resp2',
            userId: 'user2',
            submittedAt: '2024-01-02T10:00:00Z'
          }
        ],
        totalCount: 2
      };

      const getFormResponsesSpy = jest.spyOn(responseService, 'getFormResponses');
      getFormResponsesSpy.mockResolvedValue(mockResponses);

      const mockLink = document.createElement('a');
      const clickSpy = jest.spyOn(mockLink, 'click');
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      await responseService.exportToCSV('form123');

      expect(getFormResponsesSpy).toHaveBeenCalledWith('form123', 1, 1000, '');
      expect(global.Blob).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(mockLink.download).toContain('responses-form123-');
      expect(mockLink.download).toContain('.csv');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
    });

    it('should handle anonymous users', async () => {
      const mockResponses = {
        data: [
          {
            id: 'resp1',
            userId: 'user1',
            submittedAt: '2024-01-01T10:00:00Z'
          }
        ]
      };

      jest.spyOn(responseService, 'getFormResponses').mockResolvedValue(mockResponses);
      const mockLink = document.createElement('a');
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      await responseService.exportToCSV('form123');

      const blobCall = global.Blob.mock.calls[0];
      const csvContent = blobCall[0][0];
      expect(csvContent).toContain('Anonymous');
      expect(csvContent).toContain('-');
    });

    it('should alert when no responses', async () => {
      jest.spyOn(responseService, 'getFormResponses').mockResolvedValue({ data: [] });

      await responseService.exportToCSV('form123');

      expect(global.alert).toHaveBeenCalledWith('No responses to export');
      expect(global.Blob).not.toHaveBeenCalled();
    });

    it('should handle null data', async () => {
      jest.spyOn(responseService, 'getFormResponses').mockResolvedValue({ data: null });

      await responseService.exportToCSV('form123');

      expect(global.alert).toHaveBeenCalledWith('No responses to export');
    });

    it('should handle export error', async () => {
      jest.spyOn(responseService, 'getFormResponses').mockRejectedValue(new Error('Export failed'));

      await responseService.exportToCSV('form123');

      expect(console.error).toHaveBeenCalledWith('Error exporting responses:', expect.any(Error));
      expect(global.alert).toHaveBeenCalledWith('Failed to export responses');
    });

    it('should handle status not provided', async () => {
      const mockResponses = {
        data: [
          {
            id: 'resp1',
            userId: 'user1',
            user: { name: 'John' },
            submittedAt: '2024-01-01T10:00:00Z'
          }
        ]
      };

      jest.spyOn(responseService, 'getFormResponses').mockResolvedValue(mockResponses);
      const mockLink = document.createElement('a');
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      await responseService.exportToCSV('form123');

      const blobCall = global.Blob.mock.calls[0];
      const csvContent = blobCall[0][0];
      expect(csvContent).toContain('Completed');
    });
  });

  describe('downloadFile', () => {
    it('should download file attachment', async () => {
      localStorage.setItem('token', 'test-token');
      const mockBlob = new Blob(['file content']);
      api.get.mockResolvedValue({ data: mockBlob });

      const result = await responseService.downloadFile('resp123', 'q456');

      expect(api.get).toHaveBeenCalledWith(
        '/Response/resp123/file/q456',
        {
          headers: {
            Authorization: 'Bearer test-token',
          },
          responseType: 'blob',
        }
      );
      expect(result).toEqual(mockBlob);
    });

    it('should throw error on failure', async () => {
      localStorage.setItem('token', 'test-token');
      const error = new Error('Download failed');
      api.get.mockRejectedValue(error);

      await expect(responseService.downloadFile('resp123', 'q456')).rejects.toThrow('Download failed');
      expect(console.error).toHaveBeenCalledWith('Error downloading file:', error);
    });

    it('should work without token', async () => {
      const mockBlob = new Blob(['content']);
      api.get.mockResolvedValue({ data: mockBlob });

      await responseService.downloadFile('resp123', 'q456');

      expect(api.get).toHaveBeenCalledWith(
        '/Response/resp123/file/q456',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer null',
          }
        })
      );
    });
  });
});
