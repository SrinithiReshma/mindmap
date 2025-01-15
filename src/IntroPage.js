// IntroPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './IntroPage.css'; // Add custom styles
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap styles

const IntroPage = () => {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate('/app'); // Redirect to App.js
  };

  return (
    <div className="intro-container">
      <header className="header">
        <h1 className="logo">MindMesh</h1>
      </header>
      <div className="content">
        <h1 className="title">MindMesh</h1>
        <p className="description">MindMesh is a platform that helps users turn data,<br />such as PDFs, URLs, Images 
          and text files, into summaries and mind maps.
          </p>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={handleStartClick}
        >
          Click to Start
        </button>
      </div>
    </div>
  );
};

export default IntroPage;
