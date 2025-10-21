import React from 'react';
import { useNavigate } from 'react-router-dom';
import ResponseViewer from '../components/Responses/ResponseViewer';
import Button from '../components/Common/Button';
import '../styles/pages/ResponsesPage.css';

const ResponsesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="responses-page">
      <div className="page-header">
        <Button variant="secondary" onClick={() => navigate('/')}>
          ← Back to Dashboard
        </Button>
      </div>
      <ResponseViewer />
    </div>
  );
};

export default ResponsesPage;
