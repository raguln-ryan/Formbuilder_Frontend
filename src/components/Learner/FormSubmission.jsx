import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import NavigationBar from '../Common/NavigationBar';
import Modal from '../Common/Modal';
import toast from 'react-hot-toast';
import '../../styles/components/Learner/FormSubmission.css';
import success from './../../assets/success.png';

// Import Redux actions and selectors
import {
  fetchFormDetails,
  submitFormResponse,
  resetFormSubmission,
  selectCurrentForm,
  selectFormSubmission
} from '../../store/slices/learnerSlice';

const FormSubmission = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  
  // Redux selectors
  const currentForm = useSelector(selectCurrentForm);
  const formSubmission = useSelector(selectFormSubmission);
  
  // Local state for form inputs (these don't need to be in Redux)
  const [responses, setResponses] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [showClearModal, setShowClearModal] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionDetails, setSubmissionDetails] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Learner') {
      navigate('/login');
    } else {
      dispatch(fetchFormDetails(formId));
    }
  }, [isAuthenticated, user, formId, dispatch]);

  useEffect(() => {
    // Initialize responses when form data is loaded
    if (currentForm.data) {
      const initialResponses = {};
      if (currentForm.data.questions && Array.isArray(currentForm.data.questions)) {
        currentForm.data.questions.forEach(question => {
          if (question.multiple_choice === true || question.type === 'checkbox') {
            initialResponses[question.id] = [];
          } else if (question.type?.toLowerCase() === 'file_upload' || question.type?.toLowerCase() === 'file') {
            // Don't initialize file upload questions
          } else {
            initialResponses[question.id] = '';
          }
        });
      }
      setResponses(initialResponses);
    }
  }, [currentForm.data]);

  useEffect(() => {
    // Handle submission success
    if (formSubmission.success && formSubmission.submissionDetails) {
      setSubmissionSuccess(true);
      setSubmissionDetails(formSubmission.submissionDetails);
    }
  }, [formSubmission.success, formSubmission.submissionDetails]);

  // Convert file to base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleInputChange = (questionId, value) => {
    const question = currentForm.data?.questions?.find(q => q.id === questionId);
    if (question?.type?.toLowerCase() === 'file_upload' || question?.type?.toLowerCase() === 'file') {
      return;
    }
    
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleFileUpload = (questionId, file) => {
    if (file) {
      const maxSize = 5 * 1024 * 1024;
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
    }
  };

  const handleClearFormClick = () => {
    setShowClearModal(true);
  };

  const handleConfirmClear = () => {
    const clearedResponses = {};
    currentForm.data?.questions?.forEach(question => {
      if (question.type?.toLowerCase() === 'file_upload' || question.type?.toLowerCase() === 'file') {
        // Skip file upload questions
      } else if (question.multiple_choice === true || question.type === 'checkbox') {
        clearedResponses[question.id] = [];
      } else {
        clearedResponses[question.id] = '';
      }
    });
    setResponses(clearedResponses);
    setUploadedFiles({});
    setShowClearModal(false);
    toast.success('Form cleared successfully');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formSubmission.submitting) {
      return;
    }

    // Validate required fields
    const requiredQuestions = currentForm.data?.questions?.filter(q => q.required) || [];
    for (const question of requiredQuestions) {
      if (question.type?.toLowerCase() === 'file_upload' || question.type?.toLowerCase() === 'file') {
        if (!uploadedFiles[question.id]) {
          toast.error(`Please upload file for: ${question.text}`);
          return;
        }
      } else if (question.multiple_choice === true || question.type === 'checkbox') {
        if (!responses[question.id] || responses[question.id].length === 0) {
          toast.error(`Please answer: ${question.text}`);
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
            return;
          }
        }
      }
      
      // Prepare answers
      const answers = [];
      currentForm.data?.questions?.forEach(question => {
        if (question.type?.toLowerCase() === 'file_upload' || question.type?.toLowerCase() === 'file') {
          return;
        }
        
        const answer = responses[question.id];
        if (answer !== undefined) {
          answers.push({
            questionId: question.id,
            answer: Array.isArray(answer) ? answer.join(', ') : (answer || '').toString()
          });
        }
      });

      // Prepare submission data
      const submissionData = {
        formId: formId,
        answers: answers,
        fileUploads: fileUploads
      };

      console.log('Submitting data:', submissionData);
      
      // Dispatch submit action
      await dispatch(submitFormResponse(submissionData)).unwrap();
      
    } catch (error) {
      console.error('Submit error:', error);
      // Error handling is done in the slice
    }
  };

  const handleGoToSubmissions = () => {
    dispatch(resetFormSubmission());
    navigate('/learner/dashboard', { state: { activeTab: 'submissions' } });
  };

  const renderQuestionInput = (question, index) => {
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
      case 'dropdown':
        if (question.multipleChoice === true) {
          return (
            <div className="checkbox-group">
              {question.options?.map((option, idx) => (
                <label key={idx} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={typeof option === 'object' ? option.value : option}
                    checked={Array.isArray(responses[question.id]) ? 
                      responses[question.id].includes(typeof option === 'object' ? option.value : option) : false}
                    onChange={(e) => {
                      const optionValue = typeof option === 'object' ? option.value : option;
                      const current = Array.isArray(responses[question.id]) 
                        ? responses[question.id] 
                        : [];
                      const updated = e.target.checked 
                        ? [...current, optionValue]
                        : current.filter(item => item !== optionValue);
                      handleInputChange(question.id, updated);
                    }}
                  />
                  <span>{typeof option === 'object' ? option.value : option}</span>
                </label>
              ))}
            </div>
          );
        } else {
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
                <option key={idx} value={typeof option === 'object' ? option.value : option}>
                  {typeof option === 'object' ? option.value : option}
                </option>
              ))}
            </select>
          );
        }

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

  if (currentForm.loading) return <LoadingSpinner />;

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
                  <h2 className="success-title">Submitted Successfully!</h2>
                  <p className="success-message">
                    Thanks for completing this form. We've received your submission successfully.
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

  if (!currentForm.data) {
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
          <h2>{currentForm.data?.title || 'Form Submission'}</h2>
          <p className="form-subtitle">
            {currentForm.data?.description || 'Please fill out this form completely and accurately.'}
          </p>

          <form onSubmit={handleSubmit} id="submission-form">
            {currentForm.data?.questions?.map((question, index) => (
              <div key={question.id} className="question-container">
                <label className="form-label">
                  <span className="submission-q-number">{index + 1}</span> {question.text}
                  {question.required && <span className="required">*</span>}
                </label>
                {question.description && question.descriptionEnabled && (
                  <p className="question-description">{question.description}</p>
                )}
                {renderQuestionInput(question, index)}
              </div>
            ))}
          </form>
        </div>
      </div>
      
      <div className="form-footer">
        <div className="form-buttons">
          <button 
            type="button" 
            className="clear-btn"
            onClick={handleClearFormClick}
            disabled={formSubmission.submitting}
          >
            Clear Form
          </button>
          
          <div className="warning-message">
            <p style={{
              marginTop: "7px",
              fontSize: "14px",
              fontWeight: "400",
              color: "#202223"
            }}>
              This form cannot be saved temporarily, please submit once completed
            </p>
          </div>
          
          <button 
            type="button"
            className="submit-btn"
            onClick={handleSubmit}
            disabled={formSubmission.submitting}
          >
            {formSubmission.submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleConfirmClear}
        type="clear"
        title="Clear Form"
        message="Are you sure you want to clear all the information you've entered? This action cannot be undone."
      />
    </>
  );
};

export default FormSubmission;

