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
          console.log('📋 All properties:', Object.keys(submissionData));
        
          // Log each property to see what's inside
          Object.keys(submissionData).forEach(key => {
            console.log(`📌 ${key}:`, submissionData[key]);
          });
        
          setSubmission(submissionData);
          fetchFormDetails(submissionData.formId);
        
          // Try to get response details
          if (submissionData.id || submissionData.responseId) {
            fetchResponseDetails(submissionData.id || submissionData.responseId);
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
          // Log all properties
          Object.keys(foundSubmission).forEach(key => {
            console.log(`📌 ${key}:`, foundSubmission[key]);
          });
        
          setSubmission(foundSubmission);
        
          // Fetch the form details to get questions
          if (foundSubmission.formId) {
            await fetchFormDetails(foundSubmission.formId);
          }
        
          // Try to get full response details
          await fetchResponseDetails(foundSubmission.id || foundSubmission.responseId);
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
      
        // If details contains answers, log them
        if (details?.answers) {
          console.log('✅ Found answers in response details:', details.answers);
        }
        if (details?.fileUploads) {
          console.log('📁 Found file uploads:', details.fileUploads);
        }
      } catch (error) {
        console.error('❌ Error fetching response details:', error);
      
        // If API call fails, try to parse from submission.details
        if (submission?.details) {
          console.log('🔄 Trying to parse details from submission...');
          try {
            const parsedDetails = typeof submission.details === 'string' 
              ? JSON.parse(submission.details) 
              : submission.details;
            console.log('📊 Parsed details:', parsedDetails);
            setResponseDetails(parsedDetails);
          } catch (e) {
            console.error('Could not parse details:', e);
          }
        }
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

    const getAnswerValue = (question, questionIndex) => {
      console.log(`\n🔍 Looking for answer - Q${questionIndex + 1}: "${question.text || question.question}"`);
      console.log('Question ID:', question.id || question._id);
    
      // Check all possible sources for answers
      const sources = [
        { name: 'responseDetails', data: responseDetails },
        { name: 'submission.details', data: submission?.details },
        { name: 'submission', data: submission }
      ];
    
      for (const source of sources) {
        if (!source.data) continue;
      
        console.log(`Checking ${source.name}:`, source.data);
      
        let data = source.data;
      
        // Parse if string
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
            console.log(`Parsed ${source.name}:`, data);
          } catch (e) {
            continue;
          }
        }
      
        // Check for answers array
        if (data.answers && Array.isArray(data.answers)) {
          console.log(`Found answers array in ${source.name}:`, data.answers);
        
          // Try to find by questionId
          const answer = data.answers.find(a => {
            const matches = String(a.questionId) === String(question.id) || 
                         String(a.questionId) === String(question._id) ||
                         String(a.question) === String(question.id) ||
                         String(a.question) === String(question._id);
            if (matches) {
              console.log('✅ Found by ID match:', a);
            }
            return matches;
          });
        
          if (answer) {
            const value = answer.answer || answer.value || answer.response || answer.text || '';
            console.log(`✅ Answer value: "${value}"`);
            return value;
          }
        
          // Try by index
          if (data.answers[questionIndex]) {
            const answerByIndex = data.answers[questionIndex];
            console.log(`Found by index [${questionIndex}]:`, answerByIndex);
            const value = answerByIndex.answer || answerByIndex.value || answerByIndex.response || answerByIndex;
            console.log(`✅ Answer value by index: "${value}"`);
            return value;
          }
        }
      
        // Check if data itself is answers array
        if (Array.isArray(data) && data[questionIndex]) {
          console.log(`Found in array at index [${questionIndex}]:`, data[questionIndex]);
          const answer = data[questionIndex];
          return answer.answer || answer.value || answer;
        }
      }
    
      console.log('❌ No answer found for this question');
      return '';
    };

    const renderAnswer = (question, questionIndex) => {
      const answerValue = getAnswerValue(question, questionIndex);
    
      // For file upload questions
      if (question.type === 'file_upload' || question.type === 'file') {
        console.log(`📁 Checking for file upload - Q${questionIndex + 1}`);
      
        // Check for file info in various places
        let fileInfo = null;
      
        // Check responseDetails
        if (responseDetails) {
          if (responseDetails.fileUploads && Array.isArray(responseDetails.fileUploads)) {
            fileInfo = responseDetails.fileUploads.find(f => 
              String(f.questionId) === String(question.id) || 
              String(f.questionId) === String(question._id)
            ) || responseDetails.fileUploads[questionIndex];
          }
        
          if (!fileInfo && responseDetails.attachments) {
            fileInfo = responseDetails.attachments.find(f => 
              String(f.questionId) === String(question.id) || 
              String(f.questionId) === String(question._id)
            );
          }
        }
      
        console.log('File info found:', fileInfo);
      
        if (fileInfo?.fileName) {
          return (
            <button className="upload-link">
              View Uploaded File: {fileInfo.fileName}
            </button>
          );
        }
      
        // Check if answerValue looks like a filename
        if (answerValue && answerValue.includes('.')) {
          return (
            <button className="upload-link">
              View Uploaded File: {answerValue}
            </button>
          );
        }
      
        return <span className="no-answer">No file uploaded</span>;
      }

      // For date questions, format the date
      if (question.type === 'date' || question.type === 'date_picker') {
        if (answerValue && answerValue !== '-') {
          return formatDate(answerValue);
        }
      }

      // For other question types
      return answerValue || '-';
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
                const answerValue = getAnswerValue(question, index);
              
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
                  
                    {question.type === 'long_text' || question.type === 'long_answer' || question.type === 'paragraph' ? (
                      <textarea 
                        className="submission-form-textarea" 
                        value={answerValue}
                        readOnly
                        placeholder="-"
                      />
                    ) : question.type === 'file_upload' || question.type === 'file' ? (
                      renderAnswer(question, index)
                    ) : (
                      <input 
                        type="text" 
                        className="submission-form-input" 
                        value={answerValue}
                        readOnly
                        placeholder="-"
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="form-group">
                <p>Debug Information:</p>
                <pre style={{ fontSize: '11px', background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                  <strong>Submission:</strong>
                  {JSON.stringify(submission, null, 2)}
                
                  <strong>Response Details:</strong>
                  {JSON.stringify(responseDetails, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  export default SubmissionView; 
