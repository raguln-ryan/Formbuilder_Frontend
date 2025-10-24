import React from 'react';
import { useParams } from 'react-router-dom';
import FormResponses from '../components/Responses/FormResponses';
import '../styles/pages/ResponsesPage.css';

const ResponsesPage = () => {
  const { formId } = useParams();
  
  return (
    <div className="responses-page">
      <FormResponses formId={formId} />
    </div>
  );
};

export default ResponsesPage;
