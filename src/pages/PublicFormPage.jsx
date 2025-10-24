import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import '../styles/pages/PublicFormPage.css';

const PublicFormPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user?.role !== 'Learner') {
      alert('Only learners can submit forms');
      navigate('/');
      return;
    }
    
    fetchForm();
  }, [formId, isAuthenticated, user]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/response/published`);
      const forms = response.data;
      const currentForm = forms.find(f => f.formId === formId);
      
      if (currentForm) {
        setForm(currentForm);
      } else {
        setForm(null);
      }
    } catch (error) {
      console.error('Error loading form:', error);
      setForm(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors = {};
    form.questions.forEach(question => {
      if (question.required && !answers[question.id]) {
        newErrors[question.id] = 'This field is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare submission data
      const submissionData = {
        formId: formId,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer: Array.isArray(answer) ? answer.join(', ') : answer
        }))
      };

      await api.post('/response', submissionData);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear error for this field
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
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
              value={value}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              className={`form-input ${error ? 'error' : ''}`}
              placeholder="Enter your answer"
            />
            {error && <span className="error-message">{error}</span>}
          </>
        );

      case 'long_text':
        return (
          <>
            <textarea
              value={value}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              className={`form-textarea ${error ? 'error' : ''}`}
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
              value={value}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              className={`form-input ${error ? 'error' : ''}`}
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
              value={value}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              className={`form-input ${error ? 'error' : ''}`}
            />
            {error && <span className="error-message">{error}</span>}
          </>
        );

      case 'choice':
        return (
          <>
            <select
              value={value}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              className={`form-select ${error ? 'error' : ''}`}
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

      default:
        return <p>Unsupported question type</p>;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading form..." />;
  }

  if (!form) {
    return (
      <div className="error-container">
        <h1>Form Not Found</h1>
        <p>This form may have been deleted or is not published yet.</p>
        <button onClick={() => navigate('/learner')}>Back to Dashboard</button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="success-container">
        <h1>✅ Thank You!</h1>
        <p>Your response has been submitted successfully.</p>
        <button onClick={() => navigate('/learner')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="public-form-container">
      <div className="public-form-card">
        <h1>{form.title}</h1>
        <p className="form-description">{form.description}</p>
        
        <form onSubmit={handleSubmit}>
          {form.questions?.map((question, index) => (
            <div key={question.id} className="form-group">
              <label>
                {index + 1}. {question.text}
                {question.required && <span className="required">*</span>}
              </label>
              {question.description && (
                <p className="question-description">{question.description}</p>
              )}
              {renderQuestionInput(question)}
            </div>
          ))}
          
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/learner')}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
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

export default PublicFormPage;