import api from './api';

const responseService = {
  // Get all responses for a form with pagination and search (Admin only)
  getFormResponses: async (formId, page = 1, size = 10, search = '') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });
      
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      
      const response = await api.get(`/response/form/${formId}/responses?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching form responses:', error);
      return { data: [], totalCount: 0 };
    }
  },

  // Get published forms with pagination and search (Learner)
  getPublishedForms: async (page = 1, size = 10, search = '') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });
      
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      
      const response = await api.get(`/response/published?${params.toString()}`);
      console.log('Published forms:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching published forms:', error);
      throw error;
    }
  },

  // Get a specific form by ID for submission
  getFormById: async (formId) => {
    try {
      const response = await api.get(`/response/form/${formId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching form details:', error);
      throw error;
    }
  },

  // Submit form response (Learner)
  submitResponse: async (formData) => {
    try {
      const response = await api.post('/response', formData);
      return response.data;
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  },

  // Get my submissions with pagination and search (Learner)
  getMySubmissions: async (page = 1, size = 10, search = '') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });
      
      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      
      const response = await api.get(`/response/my-submissions?${params.toString()}`);
      console.log('My submissions from API:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching my submissions:', error);
      return { data: [], totalCount: 0 };
    }
  },

  // Get response details with attachments
  getResponseDetails: async (responseId) => {
    try {
      const response = await api.get(`/response/${responseId}/details`);
      return response.data;
    } catch (error) {
      console.error('Error fetching response details:', error);
      throw error;
    }
  },

  // Export responses to CSV (Admin)
  exportToCSV: async (formId) => {
    try {
      // Fetch all responses without pagination for export
      const response = await responseService.getFormResponses(formId, 1, 1000, '');
      const responses = response.data || [];
      
      if (!responses || responses.length === 0) {
        alert('No responses to export');
        return;
      }

      // Generate CSV content
      const headers = ['Response ID', 'User ID', 'User Name', 'Email', 'Submitted At', 'Status'];
      const rows = responses.map(r => [
        r.id,
        r.userId,
        r.user?.name || 'Anonymous',
        r.user?.email || '-',
        new Date(r.submittedAt).toLocaleString(),
        r.status || 'Completed'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `responses-${formId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting responses:', error);
      alert('Failed to export responses');
    }
  },

  // Download file attachment
  downloadFile: async (responseId, questionId) => {
    try {
      const response = await api.get(
        `/Response/${responseId}/file/${questionId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
};

export default responseService;
