import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import './App.css';

function App() {
  // Function to save history to localStorage
  const handleSaveHistory = (result) => {
    try {
      const savedHistory = localStorage.getItem('spamDetectionHistory');
      let history = savedHistory ? JSON.parse(savedHistory) : [];
      
      // Add new result to history (limit to last 100 items)
      history.unshift(result);
      if (history.length > 100) {
        history = history.slice(0, 100);
      }
      
      localStorage.setItem('spamDetectionHistory', JSON.stringify(history));
    } catch (e) {
      console.error('Error saving history:', e);
    }
  };

  return (
    <Router>
      <div className="app">
        <Navigation />
        <Routes>
          <Route 
            path="/" 
            element={<HomePage onSaveHistory={handleSaveHistory} />} 
          />
          <Route 
            path="/history" 
            element={<HistoryPage />} 
          />
          <Route 
            path="/analytics" 
            element={<AnalyticsPage />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
