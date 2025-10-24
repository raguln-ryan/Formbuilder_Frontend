import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import '../../styles/components/Learner/MySubmissions.css';

const MySubmissions = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubmission, setExpandedSubmission] = useState(null);

  useEffect(() => {
    fetchMySubmissions();
  }, []);

  const fetchMySubmissions = async () => {
    try {
      setLoading(true);
      // Get all forms first
      const formsResponse = await api.get('/response/published');
      const forms = formsResponse.data;
      
      // For each form, get responses and filter by current user
      const allSubmissions = [];
      
      for (const form of forms) {
        const responsesResponse = await api.get(`/response/form/${form.formId}/responses`);
        const userResponses = responsesResponse.data.filter(r => r.userId === parseInt(user.id));
        
        userResponses.forEach(response => {
          allSubmissions.push({
            ...response,
            formTitle: form.title,
            formDescription: form.description,
            questions: form.questions
          });
        });
      }
      
      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubmissionDetails = (submissionId) => {
    setExpandedSubmission(expandedSubmission === submissionId ? null : submissionId);
  };

  const getQuestionText = (submission, questionId) => {
    const question = submission.questions?.find(q => q.id === questionId);
    return question?.text || questionId;
  };

  if (loading) {
    return <LoadingSpinner message="Loading your submissions..." />;
  }

  return (
    <div className="my-submissions">
      <div className="submissions-header">
        <h2>My Submissions</h2>
        <span className="submission-count">Total: {submissions.length}</span>
      </div>

      {submissions.length === 0 ? (
        <div className="no-submissions">
          <div className="empty-icon">📭</div>
          <h3>No Submissions Yet</h3>
          <p>You haven't submitted any forms yet.</p>
        </div>
      ) : (
        <div className="submissions-list">
          {submissions.map((submission) => (
            <div key={submission.id} className="submission-card">
              <div className="submission-header">
                <div className="submission-info">
                  <h3>{submission.formTitle}</h3>
                  <p className="submission-date">
                    Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                    {' at '}
                    {new Date(submission.submittedAt).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  className="toggle-details-btn"
                  onClick={() => toggleSubmissionDetails(submission.id)}
                >
                  {expandedSubmission === submission.id ? 'Hide' : 'View'} Details
                </button>
              </div>

              {expandedSubmission === submission.id && (
                <div className="submission-details">
                  <h4>Your Responses:</h4>
                  {submission.details?.map((detail, idx) => (
                    <div key={idx} className="response-item">
                      <div className="response-question">
                        {getQuestionText(submission, detail.questionId)}
                      </div>
                      <div className="response-answer">
                        {detail.answer || 'No answer provided'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySubmissions;