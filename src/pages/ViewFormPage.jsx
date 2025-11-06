import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import NavigationBar from '../components/Common/NavigationBar';
import FormConfig from '../components/FormBuilder/FormConfig';
import SectionEditor from '../components/FormBuilder/SectionEditor';
import QuestionPreview from '../components/FormBuilder/QuestionPreview';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';
// CHANGE: Import formBuilder slice actions instead of forms slice
import {
  setFormData,
  setQuestions,
  setCurrentFormId,
  setLoading,
  setSaving,
  resetForm,
  setActiveTab as setFormBuilderActiveTab,
  togglePreview
} from '../store/slices/formBuilderSlice';
import { fetchResponses } from '../store/slices/responseSlice';
import formService from '../services/formService';
import responseService from '../services/responseService';
import '../styles/components/FormBuilder/FormEditor.css';
import '../styles/pages/ViewFormPage.css';
import character from '../assets/character.png';
import character1 from '../assets/character1.png';
import speechBubble from '../assets/speech-bubbles.png';
import round from '../assets/round.png';

const ViewFormPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // CHANGE: Get data from formBuilder slice
  const { 
    formData, 
    questions, 
    loading, 
    saving,
    showPreview,
    currentFormId
  } = useSelector(state => state.formBuilder);
  
  const { 
    responses, 
    totalItems, 
    loading: responsesLoading 
  } = useSelector(state => state.responses);
  
  const initialTab = location.state?.activeTab && 
    ['configuration', 'layout', 'responses'].includes(location.state.activeTab) 
    ? location.state.activeTab 
    : 'configuration';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [responseView, setResponseView] = useState('summary');
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('submittedAt');
  const [sortDirection, setSortDirection] = useState('desc');

  const TITLE_CHAR_LIMIT = 100;
  const DESCRIPTION_CHAR_LIMIT = 500;

  // Fetch form details on mount
  useEffect(() => {
    if (formId) {
      console.log('ViewFormPage - Fetching form details for ID:', formId);
      fetchFormDetails();
    }
    
    // Cleanup when leaving the page
    return () => {
      dispatch(resetForm());
    };
  }, [formId]);

  // CHANGE: Fetch form details into formBuilder slice
  const fetchFormDetails = async () => {
    try {
      dispatch(setLoading(true));
      
      const response = await formService.getFormById(formId);
      console.log('ViewFormPage - Raw API Response:', response);
      
      if (response) {
        // Set form data in formBuilder slice
        dispatch(setFormData({
          title: response.title || '',
          description: response.description || '',
          isVisible: response.isVisible !== undefined ? response.isVisible : true,
          status: response.status || 0
        }));
        
        // Format and set questions
        let questionsData = response.questions || [];
        console.log('ViewFormPage - Questions from API:', questionsData);
        
        if (Array.isArray(questionsData) && questionsData.length > 0) {
          const formattedQuestions = questionsData.map((q, index) => ({
            _id: q.id || q.questionId || q._id || `q_${Date.now()}_${index}`,
            type: q.type || 'short_text',
            question: q.text || q.question || q.questionText || '',
            description_enabled: q.descriptionEnabled || false,
            description: q.description || '',
            required: q.required || false,
            order: q.order !== undefined ? q.order : index,
            enabled: q.enabled !== undefined ? q.enabled : true,
            format: q.format || null,
            date_format: q.format || 'DD/MM/YYYY',
            maxLength: q.maxLength || null,
            options: q.options || [],
            single_choice: q.singleChoice || false,
            multiple_choice: q.multipleChoice || false
          }));
          
          console.log('ViewFormPage - Formatted questions:', formattedQuestions);
          dispatch(setQuestions(formattedQuestions));
        } else {
          dispatch(setQuestions([]));
        }
        
        dispatch(setCurrentFormId(formId));
      }
    } catch (error) {
      console.error('Failed to fetch form details:', error);
      toast.error('Failed to load form details');
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Fetch responses when responses tab is activated
  useEffect(() => {
    if (activeTab === 'responses' && formId) {
      dispatch(fetchResponses({
        formId,
        page: currentPage,
        pageSize: itemsPerPage,
        searchTerm
      }));
    }
  }, [activeTab, currentPage, itemsPerPage, searchTerm, formId, dispatch]);

  // Helper function to get answer value
  const getAnswerValue = (question, questionIndex, responseData) => {
    if (!responseData) return '';
    
    if (responseData.details && Array.isArray(responseData.details)) {
      const detail = responseData.details.find(d => 
        String(d.questionId) === String(question._id) || 
        String(d.questionId) === String(question.id) ||
        String(d.questionId) === String(question.questionId)
      );
      
      if (detail) {
        if (detail.answer && detail.answer.includes('[FILE_UPLOADED:')) {
          const fileName = detail.answer.replace('[FILE_UPLOADED:', '').replace(']', '');
          return fileName;
        }
        
        if (detail.answer && detail.answer.startsWith('[') && detail.answer.includes('"')) {
          try {
            const optionIds = JSON.parse(detail.answer);
            return optionIds.join(', ');
          } catch (e) {
            return detail.answer;
          }
        }
        
        return detail.answer || '';
      }
    }
    
    if (responseData.answers && Array.isArray(responseData.answers)) {
      const answer = responseData.answers.find(a => {
        return String(a.questionId) === String(question._id) || 
               String(a.questionId) === String(question.id);
      });
      
      if (answer) {
        return answer.answer || answer.value || '';
      }
    }
    
    return '';
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

  const renderAnswer = (question, questionIndex, responseData) => {
    const answerValue = getAnswerValue(question, questionIndex, responseData);
    
    if (question.type === 'file_upload' || question.type === 'file') {
      if (answerValue && answerValue !== '') {
        return (
          <button className="upload-link">
            📎 {answerValue}
          </button>
        );
      }
      return <span className="no-answer">No file uploaded</span>;
    }
    
    if (question.type === 'date' || question.type === 'date_picker') {
      if (answerValue && answerValue !== '-') {
        return formatDate(answerValue);
      }
    }
    
    if ((question.type === 'checkbox' || question.type === 'radio' || question.type === 'dropdown') && 
        question.options && question.options.length > 0) {
      if (answerValue && answerValue.includes(',')) {
        const selectedIds = answerValue.split(',').map(id => id.trim());
        const selectedOptions = question.options.filter(opt => 
          selectedIds.includes(opt.id || opt.optionId || opt)
        );
        return selectedOptions.map(opt => opt.value || opt).join(', ') || answerValue;
      }
    }
    
    return answerValue || '-';
  };

  const formatSubmissionDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  // CHANGE: These functions are now disabled in view mode
  const handleSave = async () => {
    toast.info('Cannot edit in view mode');
  };

  const handleTabChange = (tab) => {
    setTimeout(() => {
      setActiveTab(tab);
      if (tab === 'responses' && responses.length === 0) {
        dispatch(fetchResponses({
          formId,
          page: currentPage,
          pageSize: itemsPerPage,
          searchTerm
        }));
      }
    }, 100);
  };

  const handlePreview = () => {
    dispatch(togglePreview());
  };

  const handleViewResponse = (responseId) => {
    const response = responses.find(r => r.id === responseId);
    setSelectedResponse(response);
    setResponseView('individual');
  };

  const handleExportToExcel = async () => {
    try {
      await responseService.exportToCSV(formId);
      toast.success('Responses exported successfully!');
    } catch (error) {
      toast.error('Failed to export responses');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (loading && !formData.title && !questions.length) {
    return (
      <div className="view-form-page">
        <NavigationBar />
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading form details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-editor-page">
      <NavigationBar />

      <div className="form-editor-container">
        <div className="form-tabs-header">
          <div className="form-tabs">
            <button
              className={`form-tab ${activeTab === 'configuration' ? 'active' : ''}`}
              onClick={() => handleTabChange('configuration')}
            >
              Form Configuration
            </button>
            <button
              className={`form-tab ${activeTab === 'layout' ? 'active' : ''}`}
              onClick={() => handleTabChange('layout')}
            >
              Form Layout
            </button>
            <button
              className={`form-tab ${activeTab === 'responses' ? 'active' : ''}`}
              onClick={() => handleTabChange('responses')}
            >
              Responses
            </button>
          </div>
        </div>

        <div className="tab-content-wrapper">
          {activeTab === 'configuration' && (
            <FormConfig
              formId={formId}  // Pass formId to disable editing
              onSaveAsDraft={handleSave}
              onNext={() => setActiveTab('layout')}
              saving={false}
            />
          )}

          {activeTab === 'layout' && questions && questions.length > 0 && (
            <div className="form-editor-content-area1">
              <div className="form-layout-wrapper">
                <SectionEditor formId={formId} />  {/* Pass formId to disable editing */}
                
                <div className="form-config-actions-wrapper">
                  <button
                    className="action-button action-button-secondary"
                    onClick={handlePreview}
                  >
                    <span style={{ marginRight: '8px' }}>👁️</span>
                    Preview Form
                  </button>
                  <button
                    className="action-button action-button-primary"
                    onClick={handleSave}
                    disabled={true}
                  >
                    View Only
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (!questions || questions.length === 0) && (
            <div className="form-editor-content-area1">
              <div className="empty-state">
                <p>No questions available for this form.</p>
              </div>
            </div>
          )}

          {activeTab === 'responses' && (
            <div className="responses-container">
              <div className="responses-card">
                <div className="responses-tab-header">
                  <button 
                    className={`response-tab-btn ${responseView === 'summary' ? 'active' : ''}`}
                    onClick={() => setResponseView('summary')}
                  >
                    Response Summary
                  </button>
                  <button 
                    className={`response-tab-btn ${responseView === 'individual' ? 'active' : ''}`}
                    onClick={() => setResponseView('individual')}
                  >
                    Individual Response
                  </button>
                </div>

                {responseView === 'summary' ? (
                  responses.length === 0 ? (
                    <div className="empty-responses-container">
                      <div className="empty-responses-image">
                        <div className="image-composition">
                          <img src={round} alt="Background" className="empty-state-round" />
                          <img src={speechBubble} alt="Speech bubble" className="empty-state-speechbubble" />
                          <img src={character1} alt="Character 1" className="empty-state-character1" />
                          <img src={character} alt="Character 2" className="empty-state-character2" />
                        </div>
                      </div>
                      <div className="empty-responses-text">
                        <h3>No responses yet</h3>
                        <p>Share your form to start collecting responses</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="responses-toolbar">
                        <div className="search-bar">
                          <input
                            type="text"
                            placeholder="Search by Name/User ID"
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                setCurrentPage(1);
                                dispatch(fetchResponses({
                                  formId,
                                  page: 1,
                                  pageSize: itemsPerPage,
                                  searchTerm: e.target.value
                                }));
                              }
                            }}
                          />
                        </div>
                        <button className="export-btn" onClick={handleExportToExcel}>
                          📊 Export to Excel
                        </button>
                      </div>

                      <table className="responses-table">
                        <thead>
                          <tr>
                            <th onClick={() => handleSort('submittedBy')}>
                              Submitted By {sortField === 'submittedBy' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('userId')}>
                              User ID {sortField === 'userId' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Form Name</th>
                            <th onClick={() => handleSort('submittedAt')}>
                              Submitted On {sortField === 'submittedAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Email</th>
                            <th>Response</th>
                          </tr>
                        </thead>
                        <tbody>
                          {responses.map((response) => (
                            <tr key={response.id}>
                              <td>{response.submittedBy || 'Anonymous'}</td>
                              <td>{response.userId || '-'}</td>
                              <td>{formData.title || 'Untitled Form'}</td>
                              <td>{formatSubmissionDate(response.submittedAt)}</td>
                              <td>{response.email || '-'}</td>
                              <td>
                                <button 
                                  className="view-btn"
                                  onClick={() => handleViewResponse(response.id)}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="table-footer">
                        <div className="footer-left">
                          <label>Items per page</label>
                          <select 
                            className="items-select"
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                          <span>
                            {totalItems > 0 
                              ? `${((currentPage - 1) * itemsPerPage) + 1}–${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} items`
                              : '0 items'}
                          </span>
                        </div>
                        <div className="footer-right">
                          <select 
                            className="page-select"
                            value={currentPage}
                            onChange={(e) => setCurrentPage(Number(e.target.value))}
                          >
                            {Array.from({ length: Math.ceil(totalItems / itemsPerPage) || 1 }, (_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                          <span>of {Math.ceil(totalItems / itemsPerPage) || 1} pages</span>
                          <button 
                            className="nav-btn prev"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            ❮
                          </button>
                          <button 
                            className="nav-btn next"
                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalItems / itemsPerPage), prev + 1))}
                            disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                          >
                            ❯
                          </button>
                        </div>
                      </div>
                    </>
                  )
                ) : (
                  // Individual Response View
                  selectedResponse ? (
                    <div className="submission-view-wrapper">
                      <div className="submission-view-card">
                        <button
                          className="back-button"
                          onClick={() => {
                            setSelectedResponse(null);
                            setResponseView('summary');
                          }}
                          style={{ marginBottom: '1rem' }}
                        >
                          ← Back to summary
                        </button>
                        
                        <h2 className="submission-view-title">
                          {formData.title || 'Form Submission'}
                        </h2>
                        <p className="submission-view-subtitle">
                          Submitted by {selectedResponse.submittedBy} on {formatDate(selectedResponse.submittedAt)}
                        </p>

                        {questions && questions.length > 0 ? (
                          questions.map((question, index) => {
                            const answerValue = getAnswerValue(question, index, selectedResponse);
                            
                            return (
                              <div key={question._id || index} className="submission-form-group">
                                <label className="submission-form-label">
                                  <span className="submission-q-number">{index + 1}</span>
                                  {question.question || question.text}
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
                                  <div className="submission-form-input">
                                    {renderAnswer(question, index, selectedResponse)}
                                  </div>
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
                            <p>No questions available for this form.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="individual-responses-list">
                      <div className="responses-layout">
                        <div className="responses-left-panel">
                          {responses.map((response) => (
                            <div
                              key={response.id}
                              className={`response-entry ${selectedResponse?.id === response.id ? 'selected' : ''}`}
                              onClick={() => setSelectedResponse(response)}
                            >
                              <div className="response-date">
                                {new Date(response.submittedAt).toLocaleDateString()}
                              </div>
                              <div className="response-title">
                                {response.submittedBy}
                              </div>
                              <div className="response-type">
                                User ID: {response.userId}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="responses-right-panel">
                          {responses.length === 0 ? (
                            <div className="empty-state">
                              <h3>No responses yet</h3>
                              <p>When users submit responses, they will appear here</p>
                            </div>
                          ) : (
                            <div className="preview-message">
                              Select a response from the left to view details
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="bottom-actions">
                <button className="preview-btn" onClick={handlePreview}>
                  👁️ Preview Form
                </button>
                <button 
                  className="save-btn"
                  disabled={true}
                >
                  View Mode Only
                </button>
              </div>
            </div>
          )}
        </div>

        {showPreview && (
          <div className="preview-modal">
            <div className="preview-modal-content">
              <div className="preview-modal-header">
                <h2>Form Preview</h2>
                <button className="close-preview" onClick={handlePreview}>×</button>
              </div>
              <QuestionPreview
                formTitle={formData.title}
                formDescription={formData.description}
                questions={questions}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewFormPage;