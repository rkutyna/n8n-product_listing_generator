import React, { useState } from 'react';
import WorkflowForm from './components/WorkflowForm';
import ResultsDisplay from './components/ResultsDisplay';
// import './App.css';

// Point to our own backend API
const API_URL = "/api/submit";

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      // formData is now a FormData object
      const response = await fetch(API_URL, {
        method: 'POST',
        // Do NOT set Content-Type header for FormData, browser does it automatically with boundary
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Submission failed:", err);
      setError("Failed to connect to the workflow. Please check if n8n is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">✨ n8n Generator</div>
      </header>

      <main className="app-main">
        {error && <div className="error-banner">{error}</div>}

        {!result ? (
          <WorkflowForm onSubmit={handleFormSubmit} isLoading={loading} />
        ) : (
          <ResultsDisplay data={result} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default App;
