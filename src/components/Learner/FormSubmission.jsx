import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import responseService from '../../services/responseService';
import LoadingSpinner from '../Common/LoadingSpinner';
import NavigationBar from '../Common/NavigationBar';
import toast from 'react-hot-toast';
import '../../styles/components/Learner/FormSubmission.css';
import success from './../../assets/success.png';

const FormSubmission = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionDetails, setSubmissionDetails] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Learner') {
      navigate('/login');
    } else {
      fetchFormDetails();
    }
  }, [isAuthenticated, user, formId]);

  const fetchFormDetails = async () => {
    try {
      setLoading(true);
      const formData = await responseService.getFormById(formId);
      console.log('Fetched form data:', formData);
      setForm(formData);
      
      // Initialize responses with empty values
      const initialResponses = {};
      if (formData.questions && Array.isArray(formData.questions)) {
        formData.questions.forEach(question => {
          initialResponses[question.id] = '';
        });
      }
      setResponses(initialResponses);
    } catch (error) {
      console.error('Error loading form:', error);
      toast.error('Failed to load form');
      navigate('/learner/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ADD THIS FUNCTION - Convert file to base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:image/png;base64, part and return only base64 string
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleInputChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleFileUpload = (questionId, file) => {
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB to match backend
      const allowedTypes = [
        'image/jpeg', 
        'image/jpg', 
        'image/png', 
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        toast.error('File type not allowed. Please upload PDF, Word, or image files.');
        return;
      }
      
      if (file.size > maxSize) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setUploadedFiles(prev => ({
        ...prev,
        [questionId]: file
      }));
      handleInputChange(questionId, file.name);
    }
  };

  const handleClearForm = () => {
    const clearedResponses = {};
    form.questions?.forEach(question => {
      clearedResponses[question.id] = '';
    });
    setResponses(clearedResponses);
    setUploadedFiles({});
    toast.success('Form cleared');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredQuestions = form.questions?.filter(q => q.required) || [];
    for (const question of requiredQuestions) {
      // Check if it's a file upload question
      if (question.type?.toLowerCase() === 'file_upload' || question.type?.toLowerCase() === 'file') {
        if (!uploadedFiles[question.id]) {
          toast.error(`Please upload file for: ${question.text}`);
          return;
        }
      } else {
        if (!responses[question.id] || responses[question.id].toString().trim() === '') {
          toast.error(`Please answer: ${question.text}`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      
      // Prepare file uploads with base64 conversion
      const fileUploads = [];
      for (const [questionId, file] of Object.entries(uploadedFiles)) {
        if (file) {
          try {
            const base64Content = await convertFileToBase64(file);
            fileUploads.push({
              questionId: questionId,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              base64Content: base64Content
            });
          } catch (fileError) {
            console.error('Error converting file:', fileError);
            toast.error(`Error processing file: ${file.name}`);
            setSubmitting(false);
            return;
          }
        }
      }
      
      // Prepare submission data matching backend FormSubmissionDto
      const submissionData = {
        formId: formId,
        answers: Object.entries(responses)
          .filter(([questionId, answer]) => {
            // Don't include file upload questions in answers
            const question = form.questions?.find(q => q.id === questionId);
            return question?.type?.toLowerCase() !== 'file_upload' && 
                   question?.type?.toLowerCase() !== 'file';
          })
          .map(([questionId, answer]) => ({
            questionId: questionId,
            answer: Array.isArray(answer) ? answer.join(', ') : (answer || '').toString()
          })),
        fileUploads: fileUploads
      };

      console.log('Submitting data:', submissionData);

      const result = await responseService.submitResponse(submissionData);
      
      if (result.success) {
        // Instead of navigating immediately, show success card
        setSubmissionSuccess(true);
        setSubmissionDetails({
          responseId: result.responseId,
          formTitle: form.title,
          submittedAt: new Date().toISOString()
        });
        toast.success('Form submitted successfully!');
      } else {
        toast.error(result.message || 'Failed to submit form');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToSubmissions = () => {
    navigate('/learner/dashboard', { state: { activeTab: 'submissions' } });
  };

  const renderQuestionInput = (question, index) => {
    const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const emoji = emojiNumbers[index] || `${index + 1}.`;

    switch (question.type?.toLowerCase()) {
      case 'short_text':
      case 'short_answer':
      case 'text':
        return (
          <input
            type="text"
            name={`question_${question.id}`}
            placeholder={question.placeholder || "Enter your answer"}
            value={responses[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="form-input"
            required={question.required}
          />
        );

      case 'long_text':
      case 'long_answer':
      case 'paragraph':
        return (
          <textarea
            name={`question_${question.id}`}
            placeholder={question.placeholder || "Enter your detailed answer"}
            value={responses[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="form-textarea"
            required={question.required}
            rows={4}
          />
        );

      case 'choice':
      case 'multiple_choice':
      case 'dropdown':
        return (
          <select
            name={`question_${question.id}`}
            value={responses[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="form-select"
            required={question.required}
          >
            <option value="">Select an option</option>
            {question.options?.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'date':
      case 'date_picker':
        return (
          <input
            type="date"
            name={`question_${question.id}`}
            value={responses[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="form-input"
            required={question.required}
          />
        );

      case 'number':
      case 'rating':
        return (
          <input
            type="number"
            name={`question_${question.id}`}
            min={question.min || "1"}
            max={question.max || "10"}
            placeholder={question.placeholder || "Enter a number"}
            value={responses[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="form-input"
            required={question.required}
          />
        );

      case 'file':
      case 'file_upload':
        return (
          <div className="file-upload-box">
            <input
              type="file"
              id={`file_${question.id}`}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif"
              onChange={(e) => handleFileUpload(question.id, e.target.files[0])}
              style={{ display: 'none' }}
            />
            <label htmlFor={`file_${question.id}`} style={{ cursor: 'pointer' }}>
              {uploadedFiles[question.id] ? (
                <div className="file-selected">
                  <p>📎 {uploadedFiles[question.id].name}</p>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setUploadedFiles(prev => {
                        const newFiles = { ...prev };
                        delete newFiles[question.id];
                        return newFiles;
                      });
                      handleInputChange(question.id, '');
                    }}
                    className="remove-file-btn"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <p>
                    Drop files here or <span className="browse">Browse</span>
                  </p>
                  <p className="file-info">
                    Supported: PDF, Word, Images | Max size: 5MB
                  </p>
                </>
              )}
            </label>
          </div>
        );

      case 'checkbox':
        return (
          <div className="checkbox-group">
            {question.options?.map((option, idx) => (
              <label key={idx} className="checkbox-label">
                <input
                  type="checkbox"
                  value={option}
                  checked={responses[question.id]?.includes?.(option) || false}
                  onChange={(e) => {
                    const current = Array.isArray(responses[question.id]) 
                      ? responses[question.id] 
                      : [];
                    const updated = e.target.checked 
                      ? [...current, option]
                      : current.filter(item => item !== option);
                    handleInputChange(question.id, updated);
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="radio-group">
            {question.options?.map((option, idx) => (
              <label key={idx} className="radio-label">
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  value={option}
                  checked={responses[question.id] === option}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            type="text"
            name={`question_${question.id}`}
            value={responses[question.id] || ''}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="form-input"
            readOnly={question.readOnly}
            required={question.required}
          />
        );
    }
  };

  if (loading) return <LoadingSpinner />;

  if (submissionSuccess) {
    return (
      <>
        <NavigationBar />
        <div className="form-submission-container">
          <div className="submission-success-card">
            <div className="success-card-inner">
              <div className="success-content">
                <div className="success-image-container">
                  <div className="success-confetti">
                    <img src={success} alt="Success" className="success-image"/>
                  </div>
                </div>
                
                <div className="success-text">
                  <h2 className="success-title">Submitted  Successfully!</h2>
                  <p className="success-message">
                    Thanks for completing this form. We’ve received your submission successfully.
                  </p>
                  {submissionDetails?.responseId && (
                    <p className="submission-id">
                      Response ID: #{submissionDetails.responseId}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="success-footer">
                <button 
                  className="go-to-submissions-btn"
                  onClick={handleGoToSubmissions}
                >
                  Go to My Submissions
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!form) {
    return (
      <>
        <NavigationBar />
        <div className="form-submission-container">
          <div className="form-submission-card">
            <h2>Form Not Found</h2>
            <p>The requested form could not be found or is not published.</p>
            <button 
              className="submit-btn" 
              onClick={() => navigate('/learner/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavigationBar />
      <div className="form-submission-container">
        <div className="form-submission-card">
          <h2>{form?.title || 'Form Submission'}</h2>
          <p className="form-subtitle">
            {form?.description || 'Please fill out this form completely and accurately.'}
          </p>

          <form onSubmit={handleSubmit}>
            {form?.questions?.map((question, index) => (
              <div key={question.id} className="question-container">
                <label className="form-label">
                  {['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][index] || `${index + 1}.`} {question.text}
                  {question.required && <span className="required">*</span>}
                </label>
                {question.description && question.descriptionEnabled && (
                  <p className="question-description">{question.description}</p>
                )}
                {renderQuestionInput(question, index)}
              </div>
            ))}

            <div className="form-buttons">
              <button 
                type="button" 
                className="clear-btn"
                onClick={handleClearForm}
                disabled={submitting}
              >
                Clear Form
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>

            <div className="form-footer">
              <p>
                ⚠️ This form cannot be saved temporarily, please submit once completed.
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default FormSubmission;