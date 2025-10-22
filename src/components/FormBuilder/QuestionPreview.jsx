import React from 'react';
import '../../styles/components/FormBuilder/QuestionPreview.css';

const QuestionPreview = ({ formTitle, formDescription, questions }) => {
  const renderQuestionInput = (question) => {
    switch (question.type) {
      case 'short_text':
        return (
          <input
            type="text"
            className="preview-input"
            placeholder="Enter your answer"
            disabled
          />
        );

      case 'long_text':
        return (
          <textarea
            className="preview-textarea"
            placeholder="Enter your detailed answer"
            rows={4}
            disabled
          />
        );

      case 'number':
        return (
          <input
            type="number"
            className="preview-input"
            placeholder="Enter number"
            disabled
          />
        );

      case 'date_picker':
        return (
          <input
            type="date"
            className="preview-input"
            disabled
          />
        );

      case 'choice':
        return (
          <select className="preview-select" disabled>
            <option>Select an option</option>
            {(question.options || []).map((option, idx) => (
              <option key={option.optionId || idx}>
                {typeof option === 'string' ? option : option.value}
              </option>
            ))}
          </select>
        );

      case 'file_upload':
        return (
          <div className="preview-file">
            <input type="file" disabled />
            <span className="file-help">Max file size: 10MB</span>
          </div>
        );

      default:
        return <p className="unsupported-type">Unsupported question type: {question.type}</p>;
    }
  };

  return (
    <div className="question-preview">
      <div className="preview-form">
        <div className="preview-form-header">
          <h2 className="preview-title">{formTitle || 'Untitled Form'}</h2>
          {formDescription && (
            <p className="preview-description">{formDescription}</p>
          )}
        </div>
        
        {questions.length === 0 ? (
          <div className="preview-empty">
            <div className="empty-icon">📝</div>
            <p>No questions to preview</p>
            <p className="empty-hint">Add questions to see them here</p>
          </div>
        ) : (
          <div className="preview-questions">
            {questions.map((question, index) => (
              <div key={question.questionId || question.id || index} className="preview-question">
                <div className="preview-question-header">
                  <label className="preview-label">
                    <span className="preview-question-number">{index + 1}.</span>
                    <span className="preview-question-text">
                      {question.questionText || question.text || 'Untitled Question'}
                    </span>
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
        
        <div className="preview-footer">
          <p className="preview-note">
            * This is a preview. Form cannot be submitted from here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuestionPreview;
