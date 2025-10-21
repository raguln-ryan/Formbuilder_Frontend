import api from './api';

const formService = {
  getAllForms: async (offset = 0, limit = 10) => {
    try {
      const response = await api.get(`/Form?offset=${offset}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching forms:', error);
      throw error;
    }
  },

  getFormById: async (id) => {
    try {
      const response = await api.get(`/Form/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching form:', error);
      throw error;
    }
  },

  createForm: async (formData) => {
    try {
      const response = await api.post('/Form/FormConfig', formData);
      return response.data;
    } catch (error) {
      console.error('Error creating form:', error);
      throw error;
    }
  },

  updateForm: async (id, formData) => {
    try {
      const response = await api.put(`/Form/Layout/${id}`, formData);
      return response.data;
    } catch (error) {
      console.error('Error updating form:', error);
      throw error;
    }
  },

  deleteForm: async (id) => {
    try {
      const response = await api.delete(`/Form/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting form:', error);
      throw error;
    }
  },

  publishForm: async (id) => {
    try {
      const response = await api.put(`/Form/${id}/publish`);
      return response.data;
    } catch (error) {
      console.error('Error publishing form:', error);
      throw error;
    }
  }
};

// THIS LINE IS CRITICAL - MUST BE AT THE END!
export default formService;
