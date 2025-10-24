import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import '../../styles/components/Learner/FormSubmit.css';

const FormSubmit = ({ formId, formData }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAllQuestions, setShowAllQuestions] = useState(true);

  // Calculate progress
  const totalQuestions = formData?.questions?.length || 0;
  const answeredQuestions = Object.keys(answers).length;
  const progressPercentage = totalQuestions > 0 
    ? Math.round((answeredQuestions / totalQuestions) * 100) 
    : 0;

  const validateField = (questionId, value, question) => {
    if (question.required && !value) {
      return 'This field is required';
    }
    return '';
  };

  const handleInputChange = (questionId, value, question) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all required fields
    const newErrors = {};
    formData.questions.forEach(question => {
      if (question.required && !answers[question.id]) {
        newErrors[question.id] = 'This field is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const firstErrorId = Object.keys(newErrors)[0];
      const errorElement = document.getElementById(`question-${firstErrorId}`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setSubmitting(true);

      const submissionData = {
        formId: formId,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer: Array.isArray(answer) ? answer.join(', ') : String(answer)
        }))
      };

      await api.post('/response', submissionData);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(error.response?.data?.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question) => {
    const value = answers[question.id] || '';
    const error = errors[question.id];

    switch (question.type) {
      case 'short_text':
        return (
          <>
            <input
              type="text"
              className={`form-input ${error ? 'error' : ''}`}
              value={value}
              onChange={(e) => handleInputChange(question.id, e.target.value, question)}
              placeholder="Enter your answer"
            />
            {error && <span className="error-message">{error}</span>}
          </>
        );

      case 'long_text':
        return (
          <>
            <textarea
              className={`form-textarea ${error ? 'error' : ''}`}
              value={value}
              onChange={(e) => handleInputChange(question.id, e.target.value, question)}
              placeholder="Enter your detailed answer"
              rows={4}
            />
            {error && <span className="error-message">{error}</span>}
          </>
        );

      case 'number':
        return (
          <>
            <input
              type="number"
              className={`form-input ${error ? 'error' : ''}`}
              value={value}
              onChange={(e) => handleInputChange(question.id, e.target.value, question)}
              placeholder="Enter a number"
            />
            {error && <span className="error-message">{error}</span>}
          </>
        );

      case 'date_picker':
        return (
          <>
            <input
              type="date"
              className={`form-input ${error ? 'error' : ''}`}
              value={value}
              onChange={(e) => handleInputChange(question.id, e.target.value, question)}
            />
            {error && <span className="error-message">{error}</span>}
          </>
        );

      case 'choice':
        if (question.multipleChoice) {
          // Checkboxes for multiple choice
          return (
            <>
              <div className="checkbox-group">
                {question.options?.map((option, idx) => (
                  <div key={idx} className="checkbox-item">
                    <input
                      type="checkbox"
                      id={`${question.id}-${idx}`}
                      className="checkbox-input"
                      value={option}
                      checked={(value || []).includes(option)}
                      onChange={(e) => {
                        const currentValues = value || [];
                        const newValues = e.target.checked
                          ? [...currentValues, option]
                          : currentValues.filter(v => v !== option);
                        handleInputChange(question.id, newValues, question);
                      }}
                    />
                    <label htmlFor={`${question.id}-${idx}`} className="option-label">
                      {option}
                    </label>
                  </div>
                ))}
              </div>
              {error && <span className="error-message">{error}</span>}
            </>
          );
        } else {
          // Radio buttons or dropdown for single choice
          if (question.singleChoice) {
            return (
              <>
                <div className="radio-group">
                  {question.options?.map((option, idx) => (
                    <div key={idx} className="radio-item">
                      <input
                        type="radio"
                        id={`${question.id}-${idx}`}
                        name={question.id}
                        className="radio-input"
                        value={option}
                        checked={value === option}
                        onChange={(e) => handleInputChange(question.id, e.target.value, question)}
                      />
                      <label htmlFor={`${question.id}-${idx}`} className="option-label">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {error && <span className="error-message">{error}</span>}
              </>
            );
          } else {
            // Dropdown
            return (
              <>
                <select
                  className={`form-select ${error ? 'error' : ''}`}
                  value={value}
                  onChange={(e) => handleInputChange(question.id, e.target.value, question)}
                >
                  <option value="">Select an option</option>
                  {question.options?.map((option, idx) => (
                    <option key={idx} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {error && <span className="error-message">{error}</span>}
              </>
            );
          }
        }

      case 'file_upload':
        return (
          <>
            <div className="file-upload-wrapper">
              <input
                type="file"
                id={`file-${question.id}`}
                className="file-input"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handleInputChange(question.id, file.name, question);
                  }
                }}
              />
              <label htmlFor={`file-${question.id}`} className="file-upload-label">
                <span className="file-upload-icon">📁</span>
                <span className="file-upload-text">
                  {value || 'Choose a file'}
                </span>
              </label>
            </div>
            {error && <span className="error-message">{error}</span>}
          </>
        );

      default:
        return <p>Unsupported question type: {question.type}</p>;
    }
  };

  if (submitted) {
    return (
      <div className="submission-success">
        <div className="success-icon">✅</div>
        <h2 className="success-title">Thank You!</h2>
        <p className="success-message">
          Your response has been submitted successfully.
        </p>
        <button 
          className="success-btn"
          onClick={() => navigate('/learner')}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="form-submit-container">
      <div className="form-submit-card">
        <div className="form-header">
          <h1 className="form-title">{formData?.title}</h1>
          <p className="form-description">{formData?.description}</p>
        </div>

        <div className="form-progress">
          <div className="progress-info">
            <span>Progress: {answeredQuestions} of {totalQuestions} questions answered</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-body">
          {formData?.questions?.map((question, index) => (
            <div 
              key={question.id} 
              id={`question-${question.id}`}
              className="question-card"
            >
              <div className="question-header">
                <div className="question-label">
                  <span className="question-number">{index + 1}</span>
                  <span className="question-text">
                    {question.text}
                    {question.required && <span className="required-badge">*</span>}
                  </span>
                </div>
                {question.description && (
                  <p className="question-description">{question.description}</p>
                )}
              </div>
              <div className="question-input">
                {renderQuestionInput(question)}
              </div>
            </div>
          ))}

          <div className="form-actions">
            <button
              type="button"
              className="action-btn btn-secondary"
              onClick={() => navigate('/learner')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="action-btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormSubmit;