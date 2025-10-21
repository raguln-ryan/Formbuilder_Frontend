import React from 'react';
import '../../styles/components/FormBuilder/QuestionPreview.css';

const QuestionPreview = ({ formTitle, formDescription, questions }) => {
  const renderQuestionInput = (question) => {
    switch (question.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'date':
        return (
          <input
            type={question.type}
            className="preview-input"
            placeholder={`Enter ${question.type}`}
            disabled
          />
        );

      case 'textarea':
        return (
          <textarea
            className="preview-textarea"
            placeholder="Enter your answer"
            rows={4}
            disabled
          />
        );

      case 'checkbox':
        return (
          <div className="preview-options">
            {(question.options || []).map((option, idx) => (
              <label key={idx} className="preview-checkbox">
                <input type="checkbox" disabled />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="preview-options">
            {(question.options || []).map((option, idx) => (
              <label key={idx} className="preview-radio">
                <input type="radio" name={`question-${question.id}`} disabled />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'dropdown':
        return (
          <select className="preview-select" disabled>
            <option>Select an option</option>
            {(question.options || []).map((option, idx) => (
              <option key={idx}>{option}</option>
            ))}
          </select>
        );

      case 'file':
      case 'fileupload':
        return (
          <div className="preview-file">
            <input type="file" disabled />
            <span className="file-help">Max file size: 5MB</span>
          </div>
        );

      default:
        return <p>Unsupported question type</p>;
    }
  };

  return (
    <div className="question-preview">
      <div className="preview-form">
        <h2 className="preview-title">{formTitle || 'Untitled Form'}</h2>
        {formDescription && <p className="preview-description">{formDescription}</p>}
        
        {questions.length === 0 ? (
          <div className="preview-empty">
            <p>No questions to preview</p>
          </div>
        ) : (
          <div className="preview-questions">
            {questions.map((question, index) => (
              <div key={index} className="preview-question">
                <div className="preview-question-header">
                  <label className="preview-label">
                    {index + 1}. {question.text || 'Untitled Question'}
                    {question.required && <span className="required-mark">*</span>}
                  </label>
                </div>
                
                {question.descriptionEnabled && question.description && (
                  <p className="preview-description-text">{question.description}</p>
                )}
                
                <div className="preview-answer">
                  {renderQuestionInput(question)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionPreview;
