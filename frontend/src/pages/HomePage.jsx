import { useState } from 'react';
import { spamApi } from '../services/api';
import './HomePage.css';

function HomePage({ onSaveHistory }) {
  const [text, setText] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckSpam = async () => {
    setPredictionResult(null);
    setError('');

    if (!text.trim()) {
      setError('Please enter some text to analyze.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await spamApi.predict(text);

      const result = {
        ...data,
        text: text,
        timestamp: new Date().toISOString()
      };

      setPredictionResult(result);
      
      if (onSaveHistory) {
        onSaveHistory(result);
      }
      
    } catch (err) {
      setError('Failed to connect to the server. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setPredictionResult(null);
    setError('');
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="home-header">
          <h1 className="home-title">
            SMS Spam Detection
          </h1>
          <p className="home-subtitle">
            Enter your SMS message below and get instant spam detection results powered by AI
          </p>
        </div>

        <div className="input-card">
          <div className="input-header">
            <h2>Enter Message</h2>
            <button onClick={handleClear} className="clear-btn" title="Clear">
              Clear
            </button>
          </div>
          
          <textarea
            className="message-input"
            rows="8"
            placeholder="Paste your SMS message here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
          />

          <div className="input-footer">
            <div className="char-count">
              {text.length} characters
            </div>
            <button 
              onClick={handleCheckSpam} 
              disabled={isLoading || !text.trim()}
              className={`check-btn ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing...
                </>
              ) : (
                <>
                  Check for Spam
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="error-message">
              Error: {error}
            </div>
          )}
        </div>

        {predictionResult && (
          <div className={`result-card ${predictionResult.label === 'SPAM' ? 'spam' : 'ham'}`}>
            <div className="result-header">
              <div className="result-icon">
                {predictionResult.label === 'SPAM' ? '🚨' : '✅'}
              </div>
              <div className="result-title">
                <h2>{predictionResult.label === 'SPAM' ? 'Spam Detected!' : 'Safe Message'}</h2>
                <p className="result-subtitle">
                  {predictionResult.label === 'SPAM' 
                    ? 'This message appears to be spam' 
                    : 'This message appears to be legitimate'}
                </p>
              </div>
            </div>

            <div className="result-details">
              <div className="confidence-meter">
                <div className="confidence-label">
                  <span>Confidence Level</span>
                  <span className="confidence-value">
                    {(predictionResult.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill"
                    style={{ 
                      width: `${predictionResult.confidence * 100}%`,
                      backgroundColor: predictionResult.label === 'SPAM' 
                        ? '#ef4444' 
                        : '#10b981'
                    }}
                  ></div>
                </div>
              </div>

              <div className="result-info">
                <div className="info-item">
                  <span className="info-label">Threshold:</span>
                  <span className="info-value">
                    {predictionResult.threshold_used !== undefined ? predictionResult.threshold_used : '---'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Probability:</span>
                  <span className="info-value">
                    {(predictionResult.confidence * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;

