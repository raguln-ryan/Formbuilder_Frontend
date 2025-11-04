import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import NavigationBar from '../components/Common/NavigationBar';
import FormConfig from '../components/FormBuilder/FormConfig';
import SectionEditor from '../components/FormBuilder/SectionEditor';
import QuestionPreview from '../components/FormBuilder/QuestionPreview';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';
import { 
  fetchFormDetails, 
  updateForm, 
  updateFormData, 
  updateQuestions 
} from '../store/slices/formSlice';
import { fetchResponses } from '../store/slices/responseSlice';
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
  
  // Redux state
  const { 
    formData, 
    questions, 
    loading, 
    saving, 
    lastFetchedFormId 
  } = useSelector(state => state.forms);
  
  const { 
    responses, 
    totalItems, 
    loading: responsesLoading 
  } = useSelector(state => state.responses);
  
  // FIX: Check if location.state has a valid tab, otherwise default to 'configuration'
  const initialTab = location.state?.activeTab && 
    ['configuration', 'layout', 'responses'].includes(location.state.activeTab) 
    ? location.state.activeTab 
    : 'configuration';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Other local states remain same...
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});
  const [responseView, setResponseView] = useState('summary');
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('submittedAt');
  const [sortDirection, setSortDirection] = useState('desc');

  const TITLE_CHAR_LIMIT = 100;
  const DESCRIPTION_CHAR_LIMIT = 500;

  // Load form data immediately when component mounts
  useEffect(() => {
    if (formId) {
      // Always fetch form data when formId is available
      dispatch(fetchFormDetails(formId));
    }
  }, [formId, dispatch]); // Remove lastFetchedFormId from dependencies to ensure it loads

  // Debug log to see what's happening
  useEffect(() => {
    console.log('Active Tab:', activeTab);
    console.log('Form Data:', formData);
    console.log('Loading:', loading);
  }, [activeTab, formData, loading]);

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
    
    // Check details array (this is what the API returns)
    if (responseData.details && Array.isArray(responseData.details)) {
      const detail = responseData.details.find(d => 
        String(d.questionId) === String(question._id) || 
        String(d.questionId) === String(question.id) ||
        String(d.questionId) === String(question.questionId)
      );
      
      if (detail) {
        // Handle file uploads
        if (detail.answer && detail.answer.includes('[FILE_UPLOADED:')) {
          const fileName = detail.answer.replace('[FILE_UPLOADED:', '').replace(']', '');
          return fileName;
        }
        
        // Handle option selections
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
    
    // Fallback to answers array if it exists
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

  // Format date helper
  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  // Render answer based on question type
  const renderAnswer = (question, questionIndex, responseData) => {
    const answerValue = getAnswerValue(question, questionIndex, responseData);
    
    // For file upload questions
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
    
    // For date questions
    if (question.type === 'date' || question.type === 'date_picker') {
      if (answerValue && answerValue !== '-') {
        return formatDate(answerValue);
      }
    }
    
    // For option-based questions
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

  const handleInputChange = (field, value) => {
    dispatch(updateFormData({ [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleQuestionsChange = (updatedQuestions) => {
    const fixedQuestions = updatedQuestions.map(q => {
      if (!q.question && (q.questionText || q.text || q.title)) {
        return {
          ...q,
          question: q.questionText || q.text || q.title
        };
      }
      return q;
    });
    
    dispatch(updateQuestions(fixedQuestions));
  };

  const handleSave = async () => {
    try {
      if (!formData.title?.trim()) {
        toast.error('Form title is required');
        return;
      }
      
      const formattedQuestions = questions.map((q, index) => {
        const questionValue = q.question || q.questionText || q.text || '';
        
        return {
          id: q._id || q.questionId,
          questionId: q._id || q.questionId,
          type: q.type || 'short_text',
          text: questionValue,
          question: questionValue,
          questionText: questionValue,
          descriptionEnabled: q.description_enabled || false,
          description: q.description || '',
          singleChoice: false,
          multipleChoice: false,
          required: q.required || false,
          order: index,
          enabled: true,
          format: q.format || null,
          maxLength: q.maxLength || null,
          options: q.options || []
        };
      });
      
      const updateData = {
        formId: formId,
        title: formData.title,
        description: formData.description,
        status: formData.status || 0,
        questions: formattedQuestions
      };
      
      const resultAction = await dispatch(updateForm({ formId, updateData }));
      
      if (updateForm.fulfilled.match(resultAction)) {
        toast.success('Form saved successfully!');
        dispatch(fetchFormDetails(formId));
      } else {
        toast.error('Failed to save form');
      }
    } catch (err) {
      console.error('Error saving form:', err);
      toast.error(`Failed to save form: ${err.message || 'Please try again.'}`);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'responses' && responses.length === 0) {
      dispatch(fetchResponses({
        formId,
        page: currentPage,
        pageSize: itemsPerPage,
        searchTerm
      }));
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
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

  // Filter and sort responses
  const getFilteredResponses = () => {
    let filtered = [...responses];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.submittedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.userId?.toString().includes(searchTerm) ||
        r.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'submittedAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  };

  // Format responses for display
  const formattedResponses = responses.map(response => ({
    id: response.id,
    submittedBy: response.user?.name || response.submittedBy || 'Anonymous',
    userId: response.userId || '-',
    formTitle: formData.title,
    submittedAt: response.submittedAt,
    email: response.user?.email || response.email || '-',
    details: response.details || [],
    answers: response.details || []
  }));

  // Show loading only while actually loading
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

        <div className="tab-content-wrapper" key={activeTab}>
          {activeTab === 'configuration' && (
            <FormConfig
              formData={formData || { title: '', description: '', isVisible: true }}
              onInputChange={handleInputChange}
              onSaveAsDraft={handleSave}
              onNext={() => setActiveTab('layout')}
              errors={errors}
              saving={saving}
              TITLE_CHAR_LIMIT={TITLE_CHAR_LIMIT}
              DESCRIPTION_CHAR_LIMIT={DESCRIPTION_CHAR_LIMIT}
              formId={formId}
            />
          )}

          {activeTab === 'layout' && (
            <div className="form-editor-content-area1">
              <div className="form-layout-wrapper">
                <SectionEditor
                  questions={questions || []}
                  onQuestionsChange={handleQuestionsChange}
                  formTitle={formData?.title || ''}
                  formDescription={formData?.description || ''}
                  formId={formId}
                />

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
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
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
                          {formattedResponses.map((response) => (
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
                          {formattedResponses.length === 0 ? (
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
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Form'}
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
                <button className="close-preview" onClick={() => setShowPreview(false)}>×</button>
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