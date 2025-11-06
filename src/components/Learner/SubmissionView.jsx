import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../contexts/AuthContext';
import responseService from '../../services/responseService';
import LoadingSpinner from '../Common/LoadingSpinner';
import NavigationBar from '../Common/NavigationBar';
import toast from 'react-hot-toast';
import '../../styles/components/Learner/SubmissionView.css';

// Import Redux actions and selectors
import {
  fetchResponseDetails,
  fetchFormDetails,
  setCurrentSubmission,
  clearCurrentSubmission,
  selectCurrentSubmission,
  selectCurrentForm,
  selectMySubmissions
} from '../../store/slices/learnerSlice';

const SubmissionView = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  
  // Redux selectors
  const currentSubmission = useSelector(selectCurrentSubmission);
  const currentForm = useSelector(selectCurrentForm);
  const mySubmissions = useSelector(selectMySubmissions);
  
  // Local state for UI-specific things
  const [downloadingFile, setDownloadingFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Learner') {
      navigate('/login');
    } else {
      // Check if submission data was passed via location state
      if (location.state?.submission) {
        const submissionData = location.state.submission;
        console.log('📋 FULL Submission from state:', submissionData);
        
        dispatch(setCurrentSubmission(submissionData));
        dispatch(fetchFormDetails(submissionData.formId));
        
        // Only try to get response details if we don't have details already
        if (!submissionData.details || submissionData.details.length === 0) {
          if (submissionData.id || submissionData.responseId) {
            dispatch(fetchResponseDetails(submissionData.id || submissionData.responseId));
          }
        }
        setLoading(false);
      } else {
        // If no data passed, fetch from my-submissions
        fetchSubmissionFromList();
      }
    }
  }, [isAuthenticated, user, submissionId, dispatch]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentSubmission());
    };
  }, [dispatch]);

  const fetchSubmissionFromList = async () => {
    try {
      setLoading(true);
      // Use submissions from store if available
      const submissions = mySubmissions.data.length > 0 
        ? mySubmissions.data 
        : await responseService.getMySubmissions();
      
      console.log('📊 All submissions:', submissions);
      
      // Find the specific submission
      const foundSubmission = submissions.find(s => 
        String(s.id) === String(submissionId) || 
        String(s.responseId) === String(submissionId)
      );
      
      console.log('✅ Found submission:', foundSubmission);
      
      if (foundSubmission) {
        dispatch(setCurrentSubmission(foundSubmission));
        
        // Fetch the form details to get questions
        if (foundSubmission.formId) {
          await dispatch(fetchFormDetails(foundSubmission.formId));
        }
        
        // Only try to get response details if we don't have details already
        if (!foundSubmission.details || foundSubmission.details.length === 0) {
          await dispatch(fetchResponseDetails(foundSubmission.id || foundSubmission.responseId));
        }
      } else {
        throw new Error('Submission not found');
      }
    } catch (error) {
      console.error('Error loading submission:', error);
      toast.error('Failed to load submission details');
      navigate('/learner/dashboard', { state: { activeTab: 'submissions' } });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const handleDownloadFile = async (questionId, fileName) => {
    try {
      setDownloadingFile(questionId);
      
      // Get the response ID
      const responseId = currentSubmission.data?.id || currentSubmission.data?.responseId || submissionId;
      
      // Call the download API
      const response = await responseService.downloadFile(responseId, questionId);
      
      // Create a blob from the response
      const blob = new Blob([response], { 
        type: response.type || 'application/octet-stream' 
      });
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloadingFile(null);
    }
  };

  const getAnswerValue = (question) => {
    console.log(`\n🔍 Looking for answer for question: "${question.text}"`);
    console.log('Question ID:', question.id);
    console.log('Question Type:', question.type);
    
    // First check submission.details (this is where the data actually is)
    if (currentSubmission.data?.details && Array.isArray(currentSubmission.data.details)) {
      console.log('📊 Checking submission.details array');
      
      // Find the answer for this specific question by questionId
      const answerObj = currentSubmission.data.details.find(detail => 
        String(detail.questionId) === String(question.id)
      );
      
      if (answerObj) {
        console.log('✅ Found answer object:', answerObj);
        
        // Check if it's a file upload answer
        if (answerObj.answer && typeof answerObj.answer === 'string') {
          // Check for file upload pattern [FILE_UPLOADED:filename]
          const fileMatch = answerObj.answer.match(/\[FILE_UPLOADED:(.*?)\]/);
          if (fileMatch) {
            console.log('📁 Found file upload:', fileMatch[1]);
            return {
              isFile: true,
              fileName: fileMatch[1],
              questionId: question.id
            };
          }
        }
        
        // Return the regular answer
        return answerObj.answer || '';
      }
    }
    
    // Fallback: Check responseDetails if available
    if (currentSubmission.responseDetails) {
      // For file upload questions
      if (question.type?.toLowerCase() === 'file_upload' || question.type?.toLowerCase() === 'file') {
        if (currentSubmission.responseDetails.fileUploads && Array.isArray(currentSubmission.responseDetails.fileUploads)) {
          const fileUpload = currentSubmission.responseDetails.fileUploads.find(f => 
            String(f.questionId) === String(question.id)
          );
          
          if (fileUpload) {
            console.log('✅ Found file upload in responseDetails:', fileUpload);
            return {
              isFile: true,
              fileName: fileUpload.fileName,
              fileType: fileUpload.fileType,
              fileSize: fileUpload.fileSize,
              questionId: question.id
            };
          }
        }
      }
      
      // For regular answers
      if (currentSubmission.responseDetails.answers && Array.isArray(currentSubmission.responseDetails.answers)) {
        const answer = currentSubmission.responseDetails.answers.find(a => 
          String(a.questionId) === String(question.id)
        );
        
        if (answer) {
          return answer.answer || answer.value || '';
        }
      }
    }
    
    console.log('❌ No answer found for this question');
    return '';
  };

  const renderAnswer = (question) => {
    const result = getAnswerValue(question);
    
    // Check if it's a file result
    if (result && typeof result === 'object' && result.isFile) {
      if (result.fileName) {
        const isDownloading = downloadingFile === question.id;
        
        return (
          <div className="file-upload-display">
            <div style={{
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              padding: '12px 16px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: 1
              }}>
                <span style={{ fontSize: '18px' }}>📎</span>
                <span style={{ 
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {result.fileName}
                </span>
                {result.fileSize && (
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#6b7280',
                    marginLeft: '4px'
                  }}>
                    ({(result.fileSize / 1024).toFixed(2)} KB)
                  </span>
                )}
              </div>
              
              <button
                onClick={() => handleDownloadFile(question.id, result.fileName)}
                disabled={isDownloading}
                style={{
                  background: isDownloading ? '#e5e7eb' : '#3b82f6',
                  color: isDownloading ? '#9ca3af' : 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: isDownloading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {isDownloading ? (
                  <>
                    <span style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      border: '2px solid #9ca3af',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite'
                    }}></span>
                    Downloading...
                  </>
                ) : (
                  <>Download</>
                )}
              </button>
            </div>
          </div>
        );
      } else {
        return <span style={{ color: '#9ca3af' }}>No file uploaded</span>;
      }
    }
    
    // For date questions, format the date
    if (question.type === 'date' || question.type === 'date_picker') {
      if (result && result !== '-' && result !== '') {
        return formatDate(result);
      }
    }
    
    // For checkbox or multi-select questions
    if (question.type === 'checkbox' || question.multiple_choice === true) {
      if (result && typeof result === 'string' && result.includes(',')) {
        const items = result.split(',').map(item => item.trim());
        return (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {items.map((item, idx) => (
              <span key={idx} style={{
                background: '#e5e7eb',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.875rem'
              }}>
                {item}
              </span>
            ))}
          </div>
        );
      }
    }
    
    // For other question types
    return result || '-';
  };

  if (loading || currentForm.loading) return <LoadingSpinner />;

  if (!currentSubmission.data) {
    return (
      <>
        <NavigationBar />
        <div className="form-wrapper">
          <div className="form-card">
            <h2 className="form-title">Submission Not Found</h2>
            <p className="form-subtitle">The requested submission could not be found.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavigationBar />
      <div className="submission-view-wrapper" style={{maxHeight: 'calc(100vh - 56px)', height: 'calc(100vh - 56px)'}}>
        <div className="submission-view-card">
          <h2 className="submission-view-title">
            {currentSubmission.data.formTitle || currentForm.data?.title || 'Form Submission'}
          </h2>
          <p className="submission-view-subtitle">
            Submitted on {formatDate(currentSubmission.data.submittedAt)}
          </p>

          {currentForm.data?.questions ? (
            currentForm.data.questions.map((question, index) => {
              const answerContent = getAnswerValue(question);
              const isFileAnswer = answerContent && typeof answerContent === 'object' && answerContent.isFile;
              
              return (
                <div key={question.id || question._id || index} className="submission-form-group">
                  <label className="submission-form-label">
                    <span className="submission-q-number">{index + 1}</span>
                    {question.text || question.question}
                    {question.required && <span className="submission-asterisk">*</span>}
                  </label>
                  
                  {question.description && (
                    <p className="submission-form-hint">{question.description}</p>
                  )}
                  
                                  {/* Render based on question type */}
                  {question.type === 'long_text' || question.type === 'long_answer' || question.type === 'paragraph' ? (
                    <textarea 
                      className="submission-form-textarea" 
                      value={typeof answerContent === 'string' ? answerContent : ''}
                      readOnly
                      placeholder="-"
                    />
                  ) : isFileAnswer ? (
                    <div className="submission-file-display">
                      {renderAnswer(question)}
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      className="submission-form-input" 
                      value={typeof answerContent === 'string' ? renderAnswer(question) : ''}
                      readOnly
                      placeholder="-"
                    />
                  )}
                </div>
              );
            })
          ) : (
            <div className="form-group">
              <p>Loading form details...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Add spinning animation keyframe */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default SubmissionView;

