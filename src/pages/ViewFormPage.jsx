import React, { useState, useEffect } from 'react';

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import NavigationBar from '../components/Common/NavigationBar';
import FormConfig from '../components/FormBuilder/FormConfig';
import SectionEditor from '../components/FormBuilder/SectionEditor';
import QuestionPreview from '../components/FormBuilder/QuestionPreview';
import formService from '../services/formService';
import responseService from '../services/responseService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';
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
  
  // Set initial tab based on navigation state
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'configuration');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isVisible: true
  });
  const [originalFormData, setOriginalFormData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});
  const [responseView, setResponseView] = useState('summary');
  const [selectedResponse, setSelectedResponse] = useState(null);
  
  // Pagination and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('submittedAt');
  const [sortDirection, setSortDirection] = useState('desc');

  const TITLE_CHAR_LIMIT = 100;
  const DESCRIPTION_CHAR_LIMIT = 500;

  useEffect(() => {
    if (formId) {
      fetchFormDetails();
    }
  }, [formId]);

  // Fetch responses when responses tab is activated
  useEffect(() => {
    if (activeTab === 'responses' && responses.length === 0) {
      fetchResponses();
    }
  }, [activeTab]);

  const fetchFormDetails = async () => {
    try {
      setLoading(true);
      const response = await formService.getFormById(formId);
      
      if (response) {
        const data = response.data || response;
        
        const configData = {
          title: data.title || '',
          description: data.description || '',
          isVisible: data.isVisible !== undefined ? data.isVisible : true,
          status: data.status || 'draft'
        };
        
        setFormData(configData);
        setOriginalFormData(configData);
        
        let questionsData = data.questions || [];
        
        if (Array.isArray(questionsData) && questionsData.length > 0) {
          const formattedQuestions = questionsData.map((q, index) => ({
            _id: q.id || q.questionId || q._id || `q_${Date.now()}_${index}`,
            type: q.type || 'text',
            question: q.text || q.question || q.questionText || '',
            description_enabled: q.descriptionEnabled || false,
            description: q.description || '',
            required: q.required || false,
            order: q.order !== undefined ? q.order : index,
            enabled: q.enabled !== undefined ? q.enabled : true,
            format: q.format || null,
            maxLength: q.maxLength || null,
            options: q.options || []
          }));
          
          setQuestions(formattedQuestions);
        } else {
          setQuestions([]);
        }
        
        // If navigated to responses tab, fetch responses
        if (location.state?.activeTab === 'responses') {
          fetchResponses();
        }
      }
    } catch (err) {
      console.error('Error fetching form details:', err);
      toast.error('Failed to load form details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async () => {
    try {
      const data = await responseService.getFormResponses(formId);
      
      // Format responses to match table structure
      const formattedResponses = (data || []).map(response => ({
        id: response.id,
        submittedBy: response.user?.name || 'Anonymous',
        userId: response.userId || '-',
        formTitle: formData.title,
        submittedAt: response.submittedAt,
        email: response.user?.email || '-',
        details: response.details || []
      }));
      
      setResponses(formattedResponses);
    } catch (err) {
      console.error('Error fetching responses:', err);
      setResponses([]);
    }
  };

  // Filter and sort responses
  const getFilteredResponses = () => {
    let filtered = responses;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.userId.toString().includes(searchTerm) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Pagination
  const getPaginatedResponses = () => {
    const filtered = getFilteredResponses();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(getFilteredResponses().length / itemsPerPage);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'responses' && responses.length === 0) {
      fetchResponses();
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    
    setQuestions(fixedQuestions);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!formData.title?.trim()) {
        toast.error('Form title is required');
        setSaving(false);
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
      
      const response = await formService.updateForm(formId, updateData);
      
      if (response) {
        toast.success('Form saved successfully!');
        await fetchFormDetails();
      }
    } catch (err) {
      console.error('Error saving form:', err);
      toast.error(`Failed to save form: ${err.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
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

  const formatSubmissionDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  if (loading) {
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
              formData={formData}
              onInputChange={handleInputChange}
              onSaveAsDraft={handleSave}
              onNext={() => setActiveTab('layout')}
              errors={errors}
              saving={saving}
              TITLE_CHAR_LIMIT={TITLE_CHAR_LIMIT}
              DESCRIPTION_CHAR_LIMIT={DESCRIPTION_CHAR_LIMIT}
            />
          )}

          {activeTab === 'layout' && (
            <div className="form-editor-content-area1">
              <div className="form-layout-wrapper">
                <SectionEditor
                  questions={questions}
                  onQuestionsChange={handleQuestionsChange}
                  formTitle={formData.title}
                  formDescription={formData.description}
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
                          {getPaginatedResponses().map((response) => (
                            <tr key={response.id}>
                              <td>{response.submittedBy}</td>
                              <td>{response.userId}</td>
                              <td>{response.formTitle}</td>

                              <td>{formatSubmissionDate(response.submittedAt)}</td>
                              <td>{response.email}</td>
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
                            {((currentPage - 1) * itemsPerPage) + 1}–
                            {Math.min(currentPage * itemsPerPage, getFilteredResponses().length)} of {getFilteredResponses().length} items
                          </span>
                        </div>
                        <div className="footer-right">
                          <select 
                            className="page-select"
                            value={currentPage}
                            onChange={(e) => setCurrentPage(Number(e.target.value))}
                          >
                            {Array.from({ length: totalPages }, (_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                          <span>of {totalPages} pages</span>
                          <button 
                            className="nav-btn prev"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            ❮
                          </button>
                          <button 
                            className="nav-btn next"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
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
                    <div className="individual-response-detail">
                      <div className="response-detail-header">
                        <button
                          className="back-button"
                          onClick={() => setSelectedResponse(null)}
                        >
                          ← Back to list
                        </button>
                        <h2 className="response-form-title">{formData.title}</h2>
                        <p className="response-meta">
                          Submitted by: {selectedResponse.submittedBy} | 

                          Date: {formatSubmissionDate(selectedResponse.submittedAt)}
                        </p>
                      </div>
                      <div className="response-detail-content">
                        {questions.map((question, index) => {
                          const answer = selectedResponse.details?.find(d => d.questionId === question._id);
                          return (
                            <div key={question._id} className="response-field">
                              <label>{index + 1}. {question.question}</label>
                              <div className="response-answer">
                                {answer?.answer || 'No answer provided'}
                              </div>
                            </div>
                          );
                        })}
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
