import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import '../../styles/components/Learner/PublishedFormList.css';

const PublishedFormList = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublishedForms();
  }, []);

  const fetchPublishedForms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/response/published');
      setForms(response.data);
    } catch (error) {
      console.error('Error fetching published forms:', error);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFillForm = (formId) => {
    navigate(`/form/${formId}`);
  };

  if (loading) {
    return <LoadingSpinner message="Loading published forms..." />;
  }

  return (
    <div className="published-form-list">
      <div className="forms-grid">
        {forms.length === 0 ? (
          <div className="no-forms">
            <div className="empty-icon">📋</div>
            <h3>No Published Forms</h3>
            <p>There are no forms available at the moment.</p>
          </div>
        ) : (
          forms.map((form) => (
            <div key={form.formId} className="form-card">
              <div className="form-card-header">
                <h3>{form.title}</h3>
                <span className="question-count">
                  {form.questions?.length || 0} questions
                </span>
              </div>
              
              <div className="form-card-body">
                <p className="form-description">{form.description}</p>
              </div>

              <div className="form-card-footer">
                <button
                  className="fill-form-btn"
                  onClick={() => handleFillForm(form.formId)}
                >
                  Fill Form →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PublishedFormList;