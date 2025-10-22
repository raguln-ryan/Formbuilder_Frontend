import api from './api';

const formService = {
  // Get all forms
  getAllForms: async (offset = 0, limit = 10) => {
    try {
      const response = await api.get(`/Form?offset=${offset}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching forms:', error);
      throw error;
    }
  },

  // Get form by ID
  getFormById: async (id) => {
    try {
      const response = await api.get(`/Form/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching form:', error);
      throw error;
    }
  },

  // Create new form (config only)
  createForm: async (formData) => {
    try {
      const response = await api.post('/Form/FormConfig', formData);
      return response.data;
    } catch (error) {
      console.error('Error creating form:', error);
      throw error;
    }
  },

  // Update form config
  updateFormConfig: async (id, formData) => {
    try {
      const response = await api.put(`/Form/FormConfig/${id}`, formData);
      return response.data;
    } catch (error) {
      console.error('Error updating form config:', error);
      throw error;
    }
  },

  // Update form layout (questions)
  updateForm: async (id, layoutData) => {
    try {
      // First, let's try without the dto wrapper
      let payload = {
        ...layoutData,
        questions: layoutData.questions?.map((question, index) => ({
          id: question.id || `q${index + 1}`,
          type: question.type || 'text',
          title: question.title || '',
          description: question.description || '',
          required: question.required === true,
          order: question.order !== undefined ? question.order : index,
          // Only include options if they exist
          ...(question.options && question.options.length > 0 && {
            options: question.options.map(option => {
              if (typeof option === 'string') return option;
              return option.text || option.label || option.value || String(option);
            })
          })
        }))
      };

      console.log('🔵 Attempting to update form layout...');
      console.log('Form ID:', id);
      console.log('Payload being sent:', JSON.stringify(payload, null, 2));

      try {
        // First attempt: Send without dto wrapper
        const response = await api.put(`/Form/Layout/${id}`, payload);
        console.log('✅ Layout updated successfully (without dto wrapper)');
        return response.data;
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.errors?.dto) {
          // If it fails because dto is required, wrap it
          console.log('⚠️ API requires dto wrapper, retrying...');
          const wrappedPayload = { dto: payload };
          console.log('Wrapped payload:', JSON.stringify(wrappedPayload, null, 2));
          const response = await api.put(`/Form/Layout/${id}`, wrappedPayload);
          console.log('✅ Layout updated successfully (with dto wrapper)');
          return response.data;
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ Error updating form layout:', error.response?.data || error);
      throw error;
    }
  },

  // Delete form
  deleteForm: async (id) => {
    try {
      const response = await api.delete(`/Form/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting form:', error);
      throw error;
    }
  },

  // Publish form
  publishForm: async (id) => {
    try {
      console.log('🔵 Attempting to publish form:', id);
      
      // First check if form has questions
      const form = await formService.getFormById(id);
      console.log('📊 Form status before publish:');
      console.log('- Form ID:', form.id || form.formId);
      console.log('- Questions count:', form.questions?.length || 0);
      if (form.questions?.length > 0) {
        console.log('- Questions:', form.questions.map(q => ({ id: q.id, title: q.title })));
      }
      
      const response = await api.put(`/Form/${id}/publish`);
      console.log('✅ Form published successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error publishing form:', error.response?.data || error);
      throw error;
    }
  },

  // Debug helper - Check form status
  debugFormStatus: async (id) => {
    try {
      console.log('🔍 Debugging form:', id);
      const form = await formService.getFormById(id);
      console.log('📋 Form Details:');
      console.log('- ID:', form.id || form.formId);
      console.log('- Title:', form.title);
      console.log('- Status:', form.status);
      console.log('- Questions count:', form.questions?.length || 0);
      
      if (form.questions && form.questions.length > 0) {
        console.log('📝 Questions:');
        form.questions.forEach((q, index) => {
          console.log(`  ${index + 1}. ${q.title} (Type: ${q.type}, Required: ${q.required})`);
          if (q.options) {
            console.log(`     Options: ${q.options.join(', ')}`);
          }
        });
      } else {
        console.log('⚠️ No questions found in this form!');
      }
      
      return form;
    } catch (error) {
      console.error('Error debugging form:', error);
      throw error;
    }
  },

  // Complete workflow helper
  addQuestionsAndPublish: async (id, layoutData) => {
    try {
      console.log('🚀 Starting complete workflow for form:', id);
      
      // Step 1: Check initial state
      console.log('\n📊 Step 1: Checking initial form state...');
      await formService.debugFormStatus(id);
      
      // Step 2: Add questions
      console.log('\n📝 Step 2: Adding questions...');
      await formService.updateForm(id, layoutData);
      
      // Step 3: Verify questions were added
      console.log('\n✔️ Step 3: Verifying questions were added...');
      const updatedForm = await formService.debugFormStatus(id);
      
      if (!updatedForm.questions || updatedForm.questions.length === 0) {
        throw new Error('Questions were not saved properly. Cannot publish.');
      }
      
      // Step 4: Publish
      console.log('\n📤 Step 4: Publishing form...');
      const publishResponse = await formService.publishForm(id);
      
      console.log('\n🎉 Workflow completed successfully!');
      return publishResponse;
    } catch (error) {
      console.error('\n❌ Workflow failed:', error.message);
      throw error;
    }
  }
};

// THIS LINE IS CRITICAL - MUST BE AT THE END!
export default formService;
