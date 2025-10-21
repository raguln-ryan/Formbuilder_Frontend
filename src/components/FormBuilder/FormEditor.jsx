import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import formService from '../../services/formService';
import Input from '../Common/Input';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';
import QuestionEditor from './QuestionEditor';
import QuestionPreview from './QuestionPreview';
import '../../styles/components/FormBuilder/FormEditor.css';

const FormEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  
  const [formConfig, setFormConfig] = useState({
    title: '',
    description: ''
  });
  
  const [questions, setQuestions] = useState([]);
  const [formId, setFormId] = useState(id === 'new' ? null : id);

  useEffect(() => {
    if (isEdit) {
      fetchForm();
    }
  }, [id]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await formService.getFormById(id);
      setFormConfig({
        title: response.title,
        description: response.description
      });
      setQuestions(response.questions || []);
      setFormId(response.formId);
    } catch (error) {
      console.error('Error fetching form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForm = async () => {
    try {
      setSaving(true);
      
      // Step 1: Create or update form config
      if (!formId) {
        const configResponse = await formService.createFormConfig(formConfig);
        setFormId(configResponse.formId);
        
        // Step 2: Save layout if questions exist
        if (questions.length > 0) {
          await formService.updateFormLayout(configResponse.formId, { questions });
        }
      } else {
        // Update existing form
        await formService.updateFormConfig(formId, formConfig);
        
        // Update layout
        if (questions.length > 0) {
          await formService.updateFormLayout(formId, { questions });
        }
      }
      
      navigate('/');
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Error saving form: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: '',
      text: '',
      type: 'text',
      options: [],
      required: false,
      description: '',
      descriptionEnabled: false,
      order: questions.length
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index, updatedQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...updatedQuestion, order: index };
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    // Reorder remaining questions
    newQuestions.forEach((q, i) => {
      q.order = i;
    });
    setQuestions(newQuestions);
  };

  const moveQuestion = (index, direction) => {
    const newQuestions = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < questions.length) {
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
      // Update order
      newQuestions.forEach((q, i) => {
        q.order = i;
      });
      setQuestions(newQuestions);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="form-editor-container">
      <div className="form-editor-header">
        <h1>{isEdit ? 'Edit Form' : 'Create New Form'}</h1>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button onClick={handleSaveForm} disabled={saving || !formConfig.title}>
            {saving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>

      <div className="form-config-section">
        <h2>Form Configuration</h2>
        <Input
          label="Form Title"
          value={formConfig.title}
          onChange={(e) => setFormConfig({ ...formConfig, title: e.target.value })}
          required
          placeholder="Enter form title"
        />
        <Input
          type="textarea"
          label="Description"
          value={formConfig.description}
          onChange={(e) => setFormConfig({ ...formConfig, description: e.target.value })}
          placeholder="Enter form description"
        />
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          Edit Questions
        </button>
        <button
          className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
      </div>

      {activeTab === 'edit' ? (
        <div className="questions-section">
          <div className="questions-header">
            <h2>Questions</h2>
            <Button onClick={addQuestion}>Add Question</Button>
          </div>
          
          {questions.length === 0 ? (
            <div className="empty-questions">
              <p>No questions added yet</p>
              <Button onClick={addQuestion}>Add Your First Question</Button>
            </div>
          ) : (
            <div className="questions-list">
              {questions.map((question, index) => (
                <QuestionEditor
                  key={index}
                  question={question}
                  index={index}
                  totalQuestions={questions.length}
                  onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                  onDelete={() => deleteQuestion(index)}
                  onMove={(direction) => moveQuestion(index, direction)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="preview-section">
          <QuestionPreview
            formTitle={formConfig.title}
            formDescription={formConfig.description}
            questions={questions}
          />
        </div>
      )}
    </div>
  );
};

export default FormEditor;
