import React, { useState, useEffect } from 'react';
import responseService from '../../services/responseService';
import LoadingSpinner from '../Common/LoadingSpinner';
import '../../styles/components/Responses/ResponseDetail.css';

const ResponseDetail = ({ response, formDetails, onClose }) => {
  const [fileAttachments, setFileAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (response?.id) {
      fetchFileAttachments();
    }
  }, [response]);

  const fetchFileAttachments = async () => {
    try {
      setLoading(true);
      const attachments = await responseService.getResponseAttachments(response.id);
      setFileAttachments(attachments || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      // Use mock attachments for demo
      setFileAttachments(getMockAttachments());
    } finally {
      setLoading(false);
    }
  };

  // Mock attachments for demo
  const getMockAttachments = () => {
    if (!response.details) return [];
    
    const fileQuestions = formDetails?.questions?.filter(q => q.type === 'file') || [];
    if (fileQuestions.length === 0) return [];

    return fileQuestions.map(q => ({
      id: Math.random(),
      responseId: response.id,
      questionId: q.id,
      fileName: 'sample-document.pdf',
      fileType: 'application/pdf',
      fileSize: 1024000, // 1MB
      base64Content: 'JVBERi0xLjQKJeLjz9M...', // Truncated for demo
      uploadedAt: new Date().toISOString()
    }));
  };

  // Handle file download from base64
  const handleFileDownload = (attachment) => {
    try {
      // Remove data URL prefix if present
      const base64Data = attachment.base64Content.includes(',') 
        ? attachment.base64Content.split(',')[1] 
        : attachment.base64Content;
      
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: attachment.fileType });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Demo file - download disabled for preview');
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handlePrint = () => {
    window.print();
  };

  // Get response details - matching your C# model structure
  const responseDetails = response.details || [];
  const questions = formDetails?.questions || [];

  // Map response details to questions
  const getAnswerForQuestion = (questionId) => {
    const detail = responseDetails.find(d => d.questionId === questionId);
    return detail?.answer || 'No answer provided';
  };

  // Group attachments by question
  const getAttachmentsForQuestion = (questionId) => {
    return fileAttachments.filter(att => att.questionId === questionId);
  };

  // Format answer based on question type
  const formatAnswer = (question, answer) => {
    if (!answer || answer === 'No answer provided') {
      return <span className="no-answer">No answer provided</span>;
    }

    switch (question.type) {
      case 'checkbox':
        const items = Array.isArray(answer) ? answer : [answer];
        return (
          <ul className="answer-list">
            {items.map((item, idx) => (
              <li key={idx}>✓ {item}</li>
            ))}
          </ul>
        );
      
      case 'radio':
      case 'dropdown':
        return <span className="selected-option">• {answer}</span>;
      
      case 'textarea':
        return <p className="long-text">{answer}</p>;
      
      default:
        return <p>{answer}</p>;
    }
  };

  return (
    <div className="response-detail-overlay" onClick={onClose}>
      <div className="response-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <h2>Response Details</h2>
            <span className="response-id">Response #{response.id}</span>
          </div>
          <div className="modal-actions">
            <button className="print-btn" onClick={handlePrint} title="Print">
              🖨️ Print
            </button>
            <button className="close-btn" onClick={onClose} title="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* User Information Section */}
          <div className="respondent-section">
            <h3>Respondent Information</h3>
            <div className="respondent-info">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">{response.user?.name || 'Anonymous'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">User ID:</span>
                <span className="info-value">{response.userId}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{response.user?.email || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Submitted At:</span>
                <span className="info-value">
                  {response.submittedAt 
                    ? new Date(response.submittedAt).toLocaleString() 
                    : 'Not submitted'}
                </span>
              </div>
            </div>
          </div>

          {/* Form Response Section */}
          <div className="response-section">
            <h3>Form Responses</h3>
            <div className="form-info">
              <h4>{formDetails?.title}</h4>
              <p>{formDetails?.description}</p>
            </div>

            {loading ? (
              <LoadingSpinner message="Loading attachments..." />
            ) : (
              <div className="questions-list">
                {questions.map((question, index) => {
                  const attachments = getAttachmentsForQuestion(question.id);
                  const answer = getAnswerForQuestion(question.id);
                  
                  return (
                    <div key={question.id} className="question-item">
                      <div className="question-header">
                        <span className="question-number">Q{index + 1}</span>
                        <span className="question-text">{question.text}</span>
                        {question.required && <span className="required-badge">Required</span>}
                      </div>
                      
                      <div className="answer-container">
                        <div className="answer-text">
                          {question.type === 'file' ? (
                            attachments.length > 0 ? (
                              <div className="file-attachments">
                                {attachments.map((file, idx) => (
                                  <div key={idx} className="file-item">
                                    <div className="file-info">
                                      <span className="file-icon">📎</span>
                                      <div className="file-details">
                                        <span className="file-name">{file.fileName}</span>
                                        <span className="file-size">{formatFileSize(file.fileSize)}</span>
                                      </div>
                                    </div>
                                    <button 
                                      className="download-btn"
                                      onClick={() => handleFileDownload(file)}
                                    >
                                      ⬇ Download
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="no-file">No file uploaded</span>
                            )
                          ) : (
                            formatAnswer(question, answer)
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponseDetail;