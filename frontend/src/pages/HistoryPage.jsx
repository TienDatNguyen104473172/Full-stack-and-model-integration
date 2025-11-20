import { useState, useEffect } from 'react';
import './HistoryPage.css';

function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all'); // all, spam, ham

  useEffect(() => {
    // Load history from localStorage
    const savedHistory = localStorage.getItem('spamDetectionHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }
  }, []);

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      localStorage.removeItem('spamDetectionHistory');
      setHistory([]);
    }
  };

  const deleteItem = (index) => {
    const newHistory = history.filter((_, i) => i !== index);
    setHistory(newHistory);
    localStorage.setItem('spamDetectionHistory', JSON.stringify(newHistory));
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'spam') return item.label === 'SPAM';
    if (filter === 'ham') return item.label === 'HAM';
    return true;
  });

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    total: history.length,
    spam: history.filter(h => h.label === 'SPAM').length,
    ham: history.filter(h => h.label === 'HAM').length
  };

  return (
    <div className="history-page">
      <div className="history-container">
        <div className="history-header">
          <h1 className="history-title">
            <span className="title-icon">📜</span>
            Detection History
          </h1>
          <p className="history-subtitle">
            View all your previous spam detection results
          </p>
        </div>

        {history.length > 0 ? (
          <>
            <div className="history-stats">
              <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Checks</div>
              </div>
              <div className="stat-card spam-stat">
                <div className="stat-value">{stats.spam}</div>
                <div className="stat-label">Spam Detected</div>
              </div>
              <div className="stat-card ham-stat">
                <div className="stat-value">{stats.ham}</div>
                <div className="stat-label">Safe Messages</div>
              </div>
            </div>

            <div className="history-controls">
              <div className="filter-buttons">
                <button
                  className={filter === 'all' ? 'active' : ''}
                  onClick={() => setFilter('all')}
                >
                  All ({stats.total})
                </button>
                <button
                  className={filter === 'spam' ? 'active' : ''}
                  onClick={() => setFilter('spam')}
                >
                  Spam ({stats.spam})
                </button>
                <button
                  className={filter === 'ham' ? 'active' : ''}
                  onClick={() => setFilter('ham')}
                >
                  Safe ({stats.ham})
                </button>
              </div>
              <button onClick={clearHistory} className="clear-btn">
                🗑️ Clear All
              </button>
            </div>

            <div className="history-table-container">
              {filteredHistory.length > 0 ? (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Message</th>
                      <th>Confidence</th>
                      <th>Date</th>
                      <th className="action-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((item, index) => {
                      const originalIndex = history.findIndex(h => h === item);
                      return (
                        <tr key={index}>
                          <td>
                            <span className={`status-badge ${item.label === 'SPAM' ? 'spam' : 'ham'}`}>
                              <span className="badge-icon">
                                {item.label === 'SPAM' ? '🚨' : '✅'}
                              </span>
                              {item.label}
                            </span>
                          </td>
                          <td>
                            <div className="message-text" title={item.text}>
                              {item.text.length > 150
                                ? `${item.text.substring(0, 150)}...`
                                : item.text}
                            </div>
                          </td>
                          <td>
                            <div className="confidence-badge">
                              <span className="confidence-number">
                                {(item.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="date-cell">
                              {formatDate(item.timestamp)}
                            </span>
                          </td>
                          <td className="action-cell">
                            <button
                              onClick={() => deleteItem(originalIndex)}
                              className="delete-btn"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="no-results">
                  <p>No {filter === 'all' ? '' : filter} results found</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-history">
            <div className="empty-icon">📭</div>
            <h2>No History Yet</h2>
            <p>Your spam detection history will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;

