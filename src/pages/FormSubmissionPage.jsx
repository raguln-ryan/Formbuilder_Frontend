import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import responseService from '../services/responseService';
import NavigationBar from '../components/Common/NavigationBar';
import '../styles/pages/FormSubmissionPage.css';

const FormSubmissionPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('submit');
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [fileUploads, setFileUploads] = useState({});
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'submit') {
      fetchFormDetails();
    } else {
      fetchMySubmissions();
    }
  }, [formId, activeTab]);

  const fetchFormDetails = async () => {
    try {
      setLoading(true);
      const forms = await responseService.getPublishedForms();
      const currentForm = forms.find(f => f.formId === formId);
      
      if (currentForm) {
        setForm(currentForm);
        // Initialize answers
        const initialAnswers = {};
        currentForm.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
      } else {
        toast.error('Form not found');
        navigate('/learner/dashboard');
      }
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubmissions = async () => {
    try {
      setLoading(true);
      // Fetch user's submissions for this form
      // You'll need to implement this endpoint
      const submissions = await responseService.getMySubmissions(formId);
      setMySubmissions(submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleFileUpload = async (questionId, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileUploads(prev => ({
          ...prev,
          [questionId]: {
            questionId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            base64Content: reader.result.split(',')[1]
          }
        }));
        toast.success(`File ${file.name} uploaded`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredQuestions = form.questions.filter(q => q.required);
    for (const question of requiredQuestions) {
      if (!answers[question.id] && !fileUploads[question.id]) {
        toast.error(`Please answer: ${question.text}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      
      const formData = {
        formId: form.formId,
        answers: Object.entries(answers)
          .filter(([_, value]) => value)
          .map(([questionId, answer]) => ({
            questionId,
            answer
          })),
        fileUploads: Object.values(fileUploads)
      };

      await responseService.submitResponse(formData);
      toast.success('Form submitted successfully!');
      
      // Switch to submissions tab after successful submission
      setActiveTab('submissions');
      fetchMySubmissions();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question) => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            className="form-input"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            required={question.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            className="form-textarea"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            required={question.required}
            rows={4}
          />
        );

      case 'radio':
        return (
          <div className="radio-group">
            {question.options?.map((option, idx) => (
              <label key={idx} className="radio-label">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  required={question.required}
                />
                <span>{option}</span>
              </label>
            ))}
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
                  checked={answers[question.id]?.includes(option)}
                  onChange={(e) => {
                    const currentValues = answers[question.id] ? answers[question.id].split(',') : [];
                    if (e.target.checked) {
                      currentValues.push(option);
                    } else {
                      const index = currentValues.indexOf(option);
                      if (index > -1) currentValues.splice(index, 1);
                    }
                    handleAnswerChange(question.id, currentValues.join(','));
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'fileupload':
        return (
          <div className="file-upload">
            <input
              type="file"
              onChange={(e) => handleFileUpload(question.id, e.target.files[0])}
              required={question.required}
            />
            {fileUploads[question.id] && (
              <p className="file-info">
                Uploaded: {fileUploads[question.id].fileName}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="form-submission-page">
      <NavigationBar />
      
      <div className="submission-container">
        <div className="submission-tabs">
          <button
            className={`tab-button ${activeTab === 'submit' ? 'active' : ''}`}
            onClick={() => setActiveTab('submit')}
          >
            Form Submit
          </button>
          <button
            className={`tab-button ${activeTab === 'submissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('submissions')}
          >
            My Submissions
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'submit' ? (
            <div className="form-submit-content">
              {loading ? (
                <div className="loading">Loading form...</div>
              ) : form ? (
                <>
                  <div className="form-header">
                    <h1>{form.title}</h1>
                    <p>{form.description}</p>
                  </div>

                  <form onSubmit={handleSubmit} className="submission-form">
                    {form.questions.map((question, index) => (
                      <div key={question.id} className="question-block">
                        <label className="question-label">
                          {index + 1}. {question.text}
                          {question.required && <span className="required">*</span>}
                        </label>
                        
                        {question.description && question.descriptionEnabled && (
                          <p className="question-description">{question.description}</p>
                        )}

                        {renderQuestionInput(question)}
                      </div>
                    ))}

                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={() => navigate('/learner/dashboard')}
                        className="btn-cancel"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn-submit"
                      >
                        {submitting ? 'Submitting...' : 'Submit Form'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="error">Form not found</div>
              )}
            </div>
          ) : (
            <div className="my-submissions-content">
              {loading ? (
                <div className="loading">Loading submissions...</div>
              ) : mySubmissions.length > 0 ? (
                <div className="submissions-list">
                  {mySubmissions.map((submission) => (
                    <div key={submission.id} className="submission-card">
                      <div className="submission-header">
                        <span className="submission-id">Submission #{submission.id}</span>
                        <span className="submission-date">
                          {new Date(submission.submittedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="submission-status">
                        <span className="status-badge submitted">Submitted</span>
                      </div>
                      <button
                        className="view-submission-btn"
                        onClick={() => navigate(`/submission/${submission.id}/view`)}
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-submissions">
                  <p>You haven't submitted this form yet.</p>
                  <button
                    className="submit-now-btn"
                    onClick={() => setActiveTab('submit')}
                  >
                    Submit Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormSubmissionPage;