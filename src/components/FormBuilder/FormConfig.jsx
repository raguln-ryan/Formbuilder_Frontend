import React from 'react';
import '../../styles/components/FormBuilder/FormEditor.css';

const FormConfig = ({ 
  formData, 
  onInputChange, 
  onSaveAsDraft, 
  onNext, 
  errors, 
  saving,
  TITLE_CHAR_LIMIT,
  DESCRIPTION_CHAR_LIMIT 
}) => {
  const isFormValid = formData.title.trim() && formData.description.trim();

  return (
    <div className="form-config-wrapper">
      <div className="form-config-content-box">
        <div className="form-details-header">
          <span className="form-details-title">Form Details</span>
        </div>
        
        <div className="form-fields-container">
          <div className="form-name-field">
            <label className="form-field-label">
              Form Name<span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              className={`form-name-input ${errors.title ? 'error' : ''}`}
              value={formData.title}
              onChange={(e) => onInputChange('title', e.target.value)}
              placeholder="Enter Form Name"
              maxLength={TITLE_CHAR_LIMIT}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
            <span className="char-counter">{formData.title.length}/{TITLE_CHAR_LIMIT}</span>
          </div>

          <div className="form-description-field">
            <label className="form-field-label">
              Form Description
            </label>
            <textarea
              className={`form-description-input ${errors.description ? 'error' : ''}`}
              value={formData.description}
              onChange={(e) => onInputChange('description', e.target.value)}
              placeholder="Summarize the form's purpose for internal reference."
              rows={4}
              maxLength={DESCRIPTION_CHAR_LIMIT}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
            <span className="char-counter">{formData.description.length}/{DESCRIPTION_CHAR_LIMIT}</span>
          </div>
        </div>
      </div>

      <div className="form-config-actions-wrapper">
        <button
          className="action-button action-button-outline"
          onClick={onSaveAsDraft}
          disabled={saving || !isFormValid}
        >
          {saving ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          className="action-button action-button-primary"
          onClick={onNext}
          disabled={saving || !isFormValid}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default FormConfig;
