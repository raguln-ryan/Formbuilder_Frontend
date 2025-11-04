const mockBlob = new Blob(['file content'], { type: 'application/pdf' });
      const mockResponse = { data: mockBlob };
      api.get.mockResolvedValue(mockResponse);
      
      localStorage.setItem('token', 'test-token');

      const result = await responseService.downloadFile('response-1', 'question-1');

      expect(api.get).toHaveBeenCalledWith(
        '/Response/response-1/file/question-1',
        {
          headers: {
            Authorization: 'Bearer test-token',
          },
          responseType: 'blob',
        }
      );
      expect(result).toEqual(mockBlob);


    test('handles error when downloading file', async () => {
      const error = new Error('Download failed');
      api.get.mockRejectedValue(error);

      await expect(responseService.downloadFile('response-1', 'question-1')).rejects.toThrow('Download failed');
      expect(console.error).toHaveBeenCalledWith('Error downloading file:', error);
    });

    test('downloads file without token', async () => {
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });
      api.get.mockResolvedValue({ data: mockBlob });
      
      localStorage.removeItem('token');

      const result = await responseService.downloadFile('response-1', 'question-1');

      expect(api.get).toHaveBeenCalledWith(
        '/Response/response-1/file/question-1',
        {
          headers: {
            Authorization: 'Bearer null',
          },
          responseType: 'blob',
        }
      );
      expect(result).toEqual(mockBlob);
    });
  
