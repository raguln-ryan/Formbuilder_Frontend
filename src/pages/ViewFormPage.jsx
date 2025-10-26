import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavigationBar from '../components/Common/NavigationBar';
import FormConfig from '../components/FormBuilder/FormConfig';
import SectionEditor from '../components/FormBuilder/SectionEditor';
import QuestionPreview from '../components/FormBuilder/QuestionPreview';
import formService from '../services/formService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import '../styles/components/FormBuilder/FormEditor.css';
import '../styles/pages/ViewFormPage.css';
import character from '../assets/character.png';
import character1 from '../assets/character1.png';
import speechBubble from '../assets/speech-bubbles.png';
import round from '../assets/round.png';

const ViewFormPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('configuration');
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

  const TITLE_CHAR_LIMIT = 100;
  const DESCRIPTION_CHAR_LIMIT = 500;

  useEffect(() => {
    if (formId) {
      fetchFormDetails();
    }
  }, [formId]);

  const fetchFormDetails = async () => {
    try {
      setLoading(true);
      const response = await formService.getFormById(formId);
      console.log('Full form response:', response);
    
      if (response) {
        const data = response.data || response;
      
        // Set form configuration
        const configData = {
          title: data.title || '',
          description: data.description || '',
          isVisible: data.isVisible !== undefined ? data.isVisible : true,
          status: data.status || 'draft'
        };
      
        setFormData(configData);
        setOriginalFormData(configData);
      
        // Handle questions - backend returns 'text' field
        let questionsData = data.questions || [];
      
        if (Array.isArray(questionsData) && questionsData.length > 0) {
          const formattedQuestions = questionsData.map((q, index) => ({
            _id: q.id || q.questionId || q._id || `q_${Date.now()}_${index}`,
            type: q.type || 'text',
            question: q.text || q.question || q.questionText || '',  // ← Read from 'text' field
            description_enabled: q.descriptionEnabled || false,
            description: q.description || '',
            required: q.required || false,
            order: q.order !== undefined ? q.order : index,
            enabled: q.enabled !== undefined ? q.enabled : true,
            format: q.format || null,
            maxLength: q.maxLength || null,
            options: q.options || []
          }));
        
          console.log('Formatted questions from backend:', formattedQuestions);
          setQuestions(formattedQuestions);
        } else {
          setQuestions([]);
        }
      }
    } catch (err) {
      console.error('Error fetching form details:', err);
      alert('Failed to load form details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async () => {
    try {
      const response = await formService.getFormResponses(formId);
      console.log('Responses fetched:', response);
      setResponses(response?.data || response || []);
    } catch (err) {
      console.error('Error fetching responses:', err);
      setResponses([]);
    }
  };

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
    console.log('Questions updated from SectionEditor:', updatedQuestions);
    
    // Force map to ensure question field exists
    const fixedQuestions = updatedQuestions.map(q => {
      // If question field is missing but other text fields exist, copy them
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
        alert('Form title is required');
        setSaving(false);
        return;
      }
    
      console.log('=== STEP 1: Questions in state ===');
      console.log(questions);
    
      // Format questions - MAKE SURE 'text' field has the question value
      const formattedQuestions = questions.map((q, index) => {
        const questionValue = q.question || q.questionText || q.text || '';
        
        console.log(`=== STEP 2: Question ${index} ===`);
        console.log('Original question:', q);
        console.log('Question value extracted:', questionValue);
        
        const formatted = {
          id: q._id || q.questionId,
          questionId: q._id || q.questionId,
          type: q.type || 'short_text',
          text: questionValue,  // ← THIS MUST HAVE THE TEXT
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
        
        console.log('Formatted question:', formatted);
        return formatted;
      });
    
      console.log('=== STEP 3: All formatted questions ===');
      console.log(formattedQuestions);
    
      const updateData = {
        formId: formId,
        title: formData.title,
        description: formData.description,
        status: formData.status || 0,
        questions: formattedQuestions
      };
    
      console.log('=== STEP 4: Final payload being sent ===');
      console.log(JSON.stringify(updateData, null, 2));
    
      const response = await formService.updateForm(formId, updateData);
    
      console.log('=== STEP 5: Response from backend ===');
      console.log(response);
    
      if (response) {
        alert('Form saved successfully!');
        await fetchFormDetails();
      }
    } catch (err) {
      console.error('Error saving form:', err);
      alert(`Failed to save form: ${err.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleViewResponse = (responseId) => {
    const response = responses.find(r => r._id === responseId);
    setSelectedResponse(response);
    setResponseView('individual');
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
            <div className="responses-main-container">
              <div className="responses-header">
                <div className="responses-tabs-container">
                  <div className="responses-tabs">
                    <label className="response-tab-item">
                      <input
                        type="radio"
                        name="response-view"
                        value="summary"
                        checked={responseView === 'summary'}
                        onChange={() => setResponseView('summary')}
                      />
                      <span className="tab-label response-summary-tab">Response Summary</span>
                    </label>
                    <label className="response-tab-item">
                      <input
                        type="radio"
                        name="response-view"
                        value="individual"
                        checked={responseView === 'individual'}
                        onChange={() => setResponseView('individual')}
                      />
                      <span className="tab-label individual-responses-tab">Individual Responses</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="responses-toolbar">
                <div className="toolbar-content">
                  <div className="search-container">
                    <input
                      type="text"
                      className="response-search-input"
                      placeholder="Search by name/user id"
                    />
                  </div>

                  <div className="toolbar-actions">
                    <button className="filter-button">
                      <span>🔽</span> Filter
                    </button>
                    <button className="export-button">
                      <span>📊</span> Export to Excel
                    </button>
                  </div>
                </div>
              </div>

              <div className="responses-content-area">
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
                    <div className="response-summary-content">
                      <table className="response-table">
                        <thead>
                          <tr>
                            <th>Submitted By</th>
                            <th>User ID</th>
                            <th>Form Name</th>
                            <th>Submitted On</th>
                            <th>Email</th>
                            <th>Response</th>
                          </tr>
                        </thead>
                        <tbody>
                          {responses.map((response, idx) => (
                            <tr key={response._id || idx}>
                              <td>{response.submittedBy || 'Anonymous'}</td>
                              <td>{response.userId || '-'}</td>
                              <td>{formData.title}</td>
                              <td>{new Date(response.submittedAt).toLocaleString()}</td>
                              <td>{response.email || '-'}</td>
                              <td>
                                <button
                                  className="view-response-button"
                                  onClick={() => handleViewResponse(response._id)}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="pagination-container">
                        <div className="pagination-left">
                          Items per page: 10
                        </div>
                        <div className="pagination-center">
                          <button className="page-nav-button">‹</button>
                          <span className="page-info">1 of 1 pages</span>
                          <button className="page-nav-button">›</button>
                        </div>
                        <div className="pagination-right">
                          1–{responses.length} of {responses.length} items
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  responses.length === 0 ? (
                    <div className="individual-empty-container">
                      <div className="individual-empty-image">
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
                  ) : selectedResponse ? (
                    <div className="individual-response-detail">
                      <div className="response-detail-header">
                        <button
                          className="back-button"
                          onClick={() => setSelectedResponse(null)}
                        >
                          ← Back to list
                        </button>
                        <h2 className="response-form-title">{formData.title}</h2>
                      </div>
                      <div className="response-detail-content">
                        {questions.map((question, index) => (
                          <div key={question._id} className="response-field">
                            <label>{index + 1}. {question.question}</label>
                            <div className="response-answer">
                              {selectedResponse.answers?.[question._id] || '-'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="individual-responses-list">
                      <div className="responses-layout">
                        <div className="responses-left-panel">
                          {responses.map((response, index) => (
                            <div
                              key={response._id || index}
                              className="response-entry"
                              onClick={() => setSelectedResponse(response)}
                            >
                              <div className="response-date">
                                {new Date(response.submittedAt).toLocaleDateString()}
                              </div>
                              <div className="response-title">
                                {response.submittedBy || 'Anonymous'}
                              </div>
                              <div className="response-type">
                                User ID: {response.userId || '-'}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="responses-right-panel">
                          <h2 className="form-preview-title">{formData.title}</h2>
                          <p className="form-preview-description">
                            {formData.description}
                          </p>
                          <div className="preview-message">
                            Select a response from the left to view details
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
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
