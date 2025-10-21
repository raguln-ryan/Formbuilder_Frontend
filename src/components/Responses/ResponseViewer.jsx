import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { responseService } from '../../services/responseService';
import formService from '../../services/formService';
import LoadingSpinner from '../Common/LoadingSpinner';
import Button from '../Common/Button';
import '../../styles/components/Responses/ResponseViewer.css';

const ResponseViewer = () => {
  const { formId } = useParams();
  const [responses, setResponses] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);

  useEffect(() => {
    fetchData();
  }, [formId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [formData, responsesData] = await Promise.all([
        formService.getFormById(formId),
        responseService.getResponsesByForm(formId)
      ]);
      setForm(formData);
      setResponses(responsesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (responseId, questionId) => {
    try {
      await responseService.downloadFile(responseId, questionId);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getQuestionById = (questionId) => {
    return form?.questions?.find(q => q.id === questionId);
  };

  const formatAnswer = (detail) => {
    const question = getQuestionById(detail.questionId);
    if (!question) return detail.answer;

    // Check if it's a file upload
    if (detail.answer?.startsWith('[FILE_UPLOADED:')) {
      const fileName = detail.answer.match(/\[FILE_UPLOADED:(.*?)\]/)?.[1];
      return (
        <div className="file-answer">
          <span>📎 {fileName}</span>
          <Button
            size="small"
            onClick={() => handleDownloadFile(selectedResponse.id, detail.questionId)}
          >
            Download
          </Button>
        </div>
      );
    }

    // Check if it's an array of option IDs
    if (detail.answer?.startsWith('[') && detail.answer?.endsWith(']')) {
      try {
        const optionIds = JSON.parse(detail.answer);
        const selectedOptions = optionIds.map(id => {
          const cleanId = id.replace(/"/g, '');
          const option = question.options?.find(opt => opt === cleanId);
          return option || cleanId;
        });
        return selectedOptions.join(', ');
      } catch {
        return detail.answer;
      }
    }

    return detail.answer;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="response-viewer-container">
      <div className="response-viewer-header">
        <h2>Responses for: {form?.title}</h2>
        <div className="response-stats">
          Total Responses: {responses.length}
        </div>
      </div>

      {responses.length === 0 ? (
        <div className="no-responses">
          <p>No responses submitted yet</p>
        </div>
      ) : (
        <div className="responses-grid">
          <div className="response-list">
            <h3>Response List</h3>
            {responses.map((response, index) => (
              <div
                key={response.id}
                className={`response-item ${selectedResponse?.id === response.id ? 'selected' : ''}`}
                onClick={() => setSelectedResponse(response)}
              >
                <div className="response-header">
                  <span>Response #{index + 1}</span>
                  <span className="response-date">
                    {new Date(response.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="response-user">
                  User ID: {response.userId}
                </div>
              </div>
            ))}
          </div>

          <div className="response-details">
            {selectedResponse ? (
              <>
                <h3>Response Details</h3>
                <div className="response-info">
                  <p><strong>Submitted:</strong> {new Date(selectedResponse.submittedAt).toLocaleString()}</p>
                  <p><strong>User ID:</strong> {selectedResponse.userId}</p>
                </div>
                
                <div className="response-answers">
                  <h4>Answers</h4>
                  {selectedResponse.details?.map((detail, index) => {
                    const question = getQuestionById(detail.questionId);
                    return (
                      <div key={index} className="answer-item">
                        <div className="answer-question">
                          {question?.text || `Question ID: ${detail.questionId}`}
                        </div>
                        <div className="answer-value">
                          {formatAnswer(detail)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="no-selection">
                <p>Select a response to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseViewer;
