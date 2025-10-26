import React, { useState, useEffect } from 'react';
import '../../styles/components/FormBuilder/QuestionPreview.css';

const QuestionPreview = ({ formTitle, formDescription, questions }) => {
  // Initialize form values state
  const [formValues, setFormValues] = useState({});

  // Prevent background scrolling when preview is open
  useEffect(() => {
    // Add class to body to prevent background scroll
    document.body.classList.add('preview-open');
    
    // Cleanup function to remove class when component unmounts
    return () => {
      document.body.classList.remove('preview-open');
    };
  }, []);

  // Handle input changes
  const handleInputChange = (questionId, value) => {
    setFormValues(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Clear form handler
  const handleClearForm = () => {
    if (window.confirm('Are you sure you want to clear all form fields?')) {
      setFormValues({});
      // Reset any file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => input.value = '');
    }
  };

  const renderQuestionInput = (question, index) => {
    const questionId = question._id || index;
    const value = formValues[questionId] || '';

    switch (question.type) {
      case 'short_text':
        return (
          <input
            type="text"
            className="preview-input"
            placeholder="Your Answer"
            value={value}
            onChange={(e) => handleInputChange(questionId, e.target.value)}
          />
        );

      case 'long_text':
        return (
          <textarea
            className="preview-input preview-textarea"
            placeholder="Your Answer"
            value={value}
            onChange={(e) => handleInputChange(questionId, e.target.value)}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            className="preview-input"
            placeholder="Your Answer"
            value={value}
            onChange={(e) => handleInputChange(questionId, e.target.value)}
          />
        );

      case 'date_picker':
        return (
          <input
            type="date"
            className="preview-input"
            value={value}
            onChange={(e) => handleInputChange(questionId, e.target.value)}
          />
        );

      case 'choice':
        return (
          <select 
            className="preview-input"
            value={value}
            onChange={(e) => handleInputChange(questionId, e.target.value)}
          >
            <option value="">Select Answer</option>
            {(question.options || []).map((option, idx) => (
              <option key={option._id || idx} value={typeof option === 'string' ? option : option.value}>
                {typeof option === 'string' ? option : option.value}
              </option>
            ))}
          </select>
        );

      case 'file_upload':
        return (
          <div className="file-upload-preview">
            <input
              type="file"
              id={`file-${questionId}`}
              style={{ display: 'none' }}
              onChange={(e) => {
                const fileName = e.target.files[0]?.name || '';
                handleInputChange(questionId, fileName);
              }}
            />
            <div 
              className="file-upload-click-area"
              onClick={() => document.getElementById(`file-${questionId}`).click()}
            >
              {value ? (
                <div className="file-selected-container">
                  <p className="file-selected">📎 {value}</p>
                  <button 
                    className="remove-file-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInputChange(questionId, '');
                      document.getElementById(`file-${questionId}`).value = '';
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <p>Drop files here or <span className="browse">Browse</span></p>
                  <small>Supported files: PDF, PNG, JPG | Max file size: 2 MB | Only one file allowed</small>
                </>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="preview-main-container">
        <div className="form-card-preview">
          {/* Form Header */}
          <div className="form-header-preview">
            <h3 className="form-title-preview">{formTitle || 'Untitled Form'}</h3>
            {formDescription && (
              <p className="form-subtitle-preview">{formDescription}</p>
            )}
          </div>

          {/* Questions */}
          <div className="preview-form">
            {questions.length === 0 ? (
              <div className="empty-preview">
                <p>No questions to preview</p>
                <small>Add questions to see them here</small>
              </div>
            ) : (
              questions.map((question, index) => (
                <div key={question._id || index} className="form-group-preview">
                  <label className="question-label">
                    {index + 1}. {question.question || 'Untitled Question'}
                    {question.required && <span className="required-mark">*</span>}
                  </label>
                  {question.description_enabled && question.description && (
                    <p className="helper-text-preview">{question.description}</p>
                  )}
                  <div className="answer-field">
                    {renderQuestionInput(question, index)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="preview-bottom-bar">
        <button 
          className="clear-form-button"
          onClick={handleClearForm}
          disabled={questions.length === 0}
        >
          Clear Form
        </button>
      </div>
    </>
  );
};

export default QuestionPreview;
