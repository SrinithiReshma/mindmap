// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IntroPage from './IntroPage';
import MainApp from './MainApp'; // Your existing app content

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IntroPage />} />
        <Route path="/app" element={<MainApp />} />
      </Routes>
    </Router>
  );
};

export default App;
