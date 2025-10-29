  import React, { useState, useEffect } from 'react';
  import { useParams, useNavigate, useLocation } from 'react-router-dom';
  import { useAuth } from '../../contexts/AuthContext';
  import responseService from '../../services/responseService';
  import LoadingSpinner from '../Common/LoadingSpinner';
  import NavigationBar from '../Common/NavigationBar';
  import toast from 'react-hot-toast';
  import '../../styles/components/Learner/SubmissionView.css';

  const SubmissionView = () => {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();
    const [submission, setSubmission] = useState(null);
    const [formDetails, setFormDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [responseDetails, setResponseDetails] = useState(null);

    useEffect(() => {
      if (!isAuthenticated || user?.role !== 'Learner') {
        navigate('/login');
      } else {
        // Check if submission data was passed via location state
        if (location.state?.submission) {
          const submissionData = location.state.submission;
          console.log('📋 FULL Submission from state:', submissionData);
        
          setSubmission(submissionData);
          fetchFormDetails(submissionData.formId);
        
          // Only try to get response details if we don't have details already
          if (!submissionData.details || submissionData.details.length === 0) {
            if (submissionData.id || submissionData.responseId) {
              fetchResponseDetails(submissionData.id || submissionData.responseId);
            }
          }
        } else {
          // If no data passed, fetch from my-submissions
          fetchSubmissionFromList();
        }
      }
    }, [isAuthenticated, user, submissionId]);

    const fetchSubmissionFromList = async () => {
      try {
        setLoading(true);
        // Get all user's submissions
        const submissions = await responseService.getMySubmissions();
        console.log('📊 All submissions:', submissions);
      
        // Find the specific submission
        const foundSubmission = submissions.find(s => 
          String(s.id) === String(submissionId) || 
          String(s.responseId) === String(submissionId)
        );
      
        console.log('✅ Found submission:', foundSubmission);
      
        if (foundSubmission) {
          setSubmission(foundSubmission);
        
          // Fetch the form details to get questions
          if (foundSubmission.formId) {
            await fetchFormDetails(foundSubmission.formId);
          }
        
          // Only try to get response details if we don't have details already
          if (!foundSubmission.details || foundSubmission.details.length === 0) {
            await fetchResponseDetails(foundSubmission.id || foundSubmission.responseId);
          }
        } else {
          throw new Error('Submission not found');
        }
      } catch (error) {
        console.error('Error loading submission:', error);
        toast.error('Failed to load submission details');
        navigate('/learner/dashboard', { state: { activeTab: 'submissions' } });
      }
    };

    const fetchResponseDetails = async (responseId) => {
      try {
        console.log('🔄 Fetching response details for ID:', responseId);
        const details = await responseService.getResponseDetails(responseId);
        console.log('📊 Response details from API:', details);
        setResponseDetails(details);
      } catch (error) {
        // Don't show error if it's 403 - we likely have the data already
        if (error.response?.status === 403) {
          console.log('⚠️ Response details endpoint returned 403 - using submission.details instead');
        } else {
          console.error('❌ Error fetching response details:', error);
        }
      
        // We can still display the form using submission.details
        // No need to set an error state
      }
    };

    const fetchFormDetails = async (formId) => {
      try {
        const form = await responseService.getFormById(formId);
        console.log('📝 Form structure:', form);
        console.log('📝 Form questions:', form.questions);
        setFormDetails(form);
      } catch (error) {
        console.error('Error loading form details:', error);
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

    const getAnswerValue = (question) => {
      console.log(`\n🔍 Looking for answer for question: "${question.text}"`);
      console.log('Question ID:', question.id);
      console.log('Question Type:', question.type);
    
      // First check submission.details (this is where the data actually is)
      if (submission?.details && Array.isArray(submission.details)) {
        console.log('📊 Checking submission.details array');
      
        // Find the answer for this specific question by questionId
        const answerObj = submission.details.find(detail => 
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
                fileName: fileMatch[1]
              };
            }
          }
        
          // Return the regular answer
          return answerObj.answer || '';
        }
      }
    
      // Fallback: Check responseDetails if available (though it's returning 403)
      if (responseDetails) {
        // For file upload questions
        if (question.type?.toLowerCase() === 'file_upload' || question.type?.toLowerCase() === 'file') {
          if (responseDetails.fileUploads && Array.isArray(responseDetails.fileUploads)) {
            const fileUpload = responseDetails.fileUploads.find(f => 
              String(f.questionId) === String(question.id)
            );
            
            if (fileUpload) {
              console.log('✅ Found file upload in responseDetails:', fileUpload);
              return {
                isFile: true,
                fileName: fileUpload.fileName,
                fileType: fileUpload.fileType,
                fileSize: fileUpload.fileSize
              };
            }
          }
        }
      
        // For regular answers
        if (responseDetails.answers && Array.isArray(responseDetails.answers)) {
          const answer = responseDetails.answers.find(a => 
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
          return (
            <div className="file-upload-display">
              <div style={{
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                padding: '8px 12px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📎 {result.fileName}
                {result.fileSize && (
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    ({(result.fileSize / 1024).toFixed(2)} KB)
                  </span>
                )}
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

    if (loading) return <LoadingSpinner />;

    if (!submission) {
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
        <div className="submission-view-wrapper">
          <div className="submission-view-card">
            <h2 className="submission-view-title">
              {submission.formTitle || formDetails?.title || 'Form Submission'}
            </h2>
            <p className="submission-view-subtitle">
              Submitted on {formatDate(submission.submittedAt)}
            </p>

            {formDetails?.questions ? (
              formDetails.questions.map((question, index) => {
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
      </>
    );
  };

  export default SubmissionView; 
