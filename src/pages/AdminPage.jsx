// In your handleView function
const handleView = (formId) => {
  // Don't pass activeTab in state, let it default to 'configuration'
  navigate(`/view-form/${formId}`);
  // OR if you want to explicitly set it:
  // navigate(`/view-form/${formId}`, { state: { activeTab: 'configuration' } });
};