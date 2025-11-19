import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { spamApi } from '../services/api'; // <--- IMPORT MỚI
import './AnalyticsPage.css';

function AnalyticsPage() {
  const [history, setHistory] = useState([]);
  const [liveModelInfo, setLiveModelInfo] = useState(null); // <--- STATE MỚI: Lưu info từ backend

  useEffect(() => {
    // 1. Load History từ LocalStorage
    const savedHistory = localStorage.getItem('spamDetectionHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }

    // 2. Load Live Model Info từ Backend API (MỚI)
    const fetchModelInfo = async () => {
        try {
            const info = await spamApi.getInfo();
            setLiveModelInfo(info);
        } catch (error) {
            console.error("Failed to fetch live model info", error);
        }
    };
    fetchModelInfo();
  }, []);

  // Dữ liệu mặc định (Fallback nếu chưa load được API)
  const defaultThreshold = 0.2185;
  
  // Ưu tiên lấy Threshold từ API, nếu không có thì dùng số cũ
  const currentThreshold = liveModelInfo?.threshold || defaultThreshold;

  // Model training metrics (Giữ nguyên các chỉ số Training tĩnh vì Backend chưa trả về chi tiết này)
  const modelMetrics = {
    validation: {
      logisticRegression: { accuracy: 0.9649, precision: 0.9213, recall: 0.7885, f1Score: 0.8497 },
      randomForest: { accuracy: 0.9746, precision: 1.0000, recall: 0.7981, f1Score: 0.8877 }
    },
    test: {
      logisticRegression: {
        accuracy: 0.9836,
        precision: 0.9191,
        recall: 0.9542,
        f1Score: 0.9363,
        threshold: currentThreshold // <--- SỬ DỤNG BIẾN ĐỘNG
      }
    }
  };

  // --- CÁC BIẾN CHART DỮ LIỆU GIỮ NGUYÊN NHƯ CŨ ---
  const comparisonData = [
    { name: 'Accuracy', 'Logistic Regression (Val)': modelMetrics.validation.logisticRegression.accuracy * 100, 'Random Forest (Val)': modelMetrics.validation.randomForest.accuracy * 100, 'Logistic Regression (Test)': modelMetrics.test.logisticRegression.accuracy * 100 },
    { name: 'Precision', 'Logistic Regression (Val)': modelMetrics.validation.logisticRegression.precision * 100, 'Random Forest (Val)': modelMetrics.validation.randomForest.precision * 100, 'Logistic Regression (Test)': modelMetrics.test.logisticRegression.precision * 100 },
    { name: 'Recall', 'Logistic Regression (Val)': modelMetrics.validation.logisticRegression.recall * 100, 'Random Forest (Val)': modelMetrics.validation.randomForest.recall * 100, 'Logistic Regression (Test)': modelMetrics.test.logisticRegression.recall * 100 },
    { name: 'F1-Score', 'Logistic Regression (Val)': modelMetrics.validation.logisticRegression.f1Score * 100, 'Random Forest (Val)': modelMetrics.validation.randomForest.f1Score * 100, 'Logistic Regression (Test)': modelMetrics.test.logisticRegression.f1Score * 100 }
  ];

  const metricsLineData = [
    { metric: 'Accuracy', 'LogReg Val': modelMetrics.validation.logisticRegression.accuracy * 100, 'RF Val': modelMetrics.validation.randomForest.accuracy * 100, 'LogReg Test': modelMetrics.test.logisticRegression.accuracy * 100 },
    { metric: 'Precision', 'LogReg Val': modelMetrics.validation.logisticRegression.precision * 100, 'RF Val': modelMetrics.validation.randomForest.precision * 100, 'LogReg Test': modelMetrics.test.logisticRegression.precision * 100 },
    { metric: 'Recall', 'LogReg Val': modelMetrics.validation.logisticRegression.recall * 100, 'RF Val': modelMetrics.validation.randomForest.recall * 100, 'LogReg Test': modelMetrics.test.logisticRegression.recall * 100 },
    { metric: 'F1-Score', 'LogReg Val': modelMetrics.validation.logisticRegression.f1Score * 100, 'RF Val': modelMetrics.validation.randomForest.f1Score * 100, 'LogReg Test': modelMetrics.test.logisticRegression.f1Score * 100 }
  ];

  const userStats = {
    total: history.length,
    spam: history.filter(h => h.label === 'SPAM').length,
    ham: history.filter(h => h.label === 'HAM').length,
    avgConfidence: history.length > 0 ? history.reduce((sum, h) => sum + h.confidence, 0) / history.length : 0
  };

  const userPieData = [
    { name: 'Spam', value: userStats.spam, color: '#ef4444' },
    { name: 'Safe', value: userStats.ham, color: '#10b981' }
  ];

  const getDailyTrend = () => {
    if (history.length === 0) return [];
    const dailyData = {};
    history.forEach(item => {
      if (item.timestamp) {
        const date = new Date(item.timestamp).toLocaleDateString();
        if (!dailyData[date]) dailyData[date] = { date, spam: 0, ham: 0 };
        if (item.label === 'SPAM') dailyData[date].spam++;
        else dailyData[date].ham++;
      }
    });
    return Object.values(dailyData).slice(-7);
  };

  const dailyTrend = getDailyTrend();

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        <div className="analytics-header">
          <h1 className="analytics-title">
            <span className="title-icon">📊</span> Model Analytics
          </h1>
          {/* Hiển thị trạng thái kết nối với Backend */}
          <div style={{fontSize: '0.9rem', color: liveModelInfo ? '#10b981' : '#ef4444', marginTop: '5px'}}>
             {liveModelInfo ? '● Backend Connected' : '● Offline / Using Cached Data'}
          </div>
          <p className="analytics-subtitle">Performance metrics and detection statistics</p>
        </div>

        {/* Model Performance Section */}
        <section className="analytics-section">
          <h2 className="section-title">Model Performance Metrics</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Test Accuracy</div>
              <div className="metric-value">{(modelMetrics.test.logisticRegression.accuracy * 100).toFixed(2)}%</div>
              <div className="metric-description">Final model accuracy on test set</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Test Recall</div>
              <div className="metric-value">{(modelMetrics.test.logisticRegression.recall * 100).toFixed(2)}%</div>
              <div className="metric-description">Spam detection rate (target ≥ 90%)</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Test Precision</div>
              <div className="metric-value">{(modelMetrics.test.logisticRegression.precision * 100).toFixed(2)}%</div>
              <div className="metric-description">Accuracy of spam predictions</div>
            </div>
            
            {/* CARD QUAN TRỌNG: HIỂN THỊ THRESHOLD THẬT */}
            <div className="metric-card" style={{border: '2px solid #667eea'}}>
              <div className="metric-label">Active Threshold</div>
              <div className="metric-value">
                {modelMetrics.test.logisticRegression.threshold}
              </div>
              <div className="metric-description">
                 {liveModelInfo ? "Live value from Server" : "Default static value"}
              </div>
            </div>

          </div>
        </section>

        {/* Comparison Charts */}
        <section className="analytics-section">
          <h2 className="section-title">Model Comparison</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                <Legend />
                <Bar dataKey="Logistic Regression (Val)" fill="#667eea" />
                <Bar dataKey="Random Forest (Val)" fill="#764ba2" />
                <Bar dataKey="Logistic Regression (Test)" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Metrics Line Chart */}
        <section className="analytics-section">
          <h2 className="section-title">Metrics Trend</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={metricsLineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                <Legend />
                <Line type="monotone" dataKey="LogReg Val" stroke="#667eea" strokeWidth={3} dot={{ r: 6 }} />
                <Line type="monotone" dataKey="RF Val" stroke="#764ba2" strokeWidth={3} dot={{ r: 6 }} />
                <Line type="monotone" dataKey="LogReg Test" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* User Statistics */}
        {history.length > 0 && (
          <>
            <section className="analytics-section">
              <h2 className="section-title">Your Detection Statistics</h2>
              <div className="user-stats-grid">
                <div className="user-stat-card">
                  <div className="user-stat-label">Total Checks</div>
                  <div className="user-stat-value">{userStats.total}</div>
                </div>
                <div className="user-stat-card spam-stat">
                  <div className="user-stat-label">Spam Detected</div>
                  <div className="user-stat-value">{userStats.spam}</div>
                </div>
                <div className="user-stat-card ham-stat">
                  <div className="user-stat-label">Safe Messages</div>
                  <div className="user-stat-value">{userStats.ham}</div>
                </div>
                <div className="user-stat-card">
                  <div className="user-stat-label">Avg Confidence</div>
                  <div className="user-stat-value">{(userStats.avgConfidence * 100).toFixed(1)}%</div>
                </div>
              </div>
            </section>

            <section className="analytics-section">
              <h2 className="section-title">Detection Distribution</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={userPieData} cx="50%" cy="50%" labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100} fill="#8884d8" dataKey="value">
                      {userPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            {dailyTrend.length > 0 && (
              <section className="analytics-section">
                <h2 className="section-title">Daily Detection Trend (Last 7 Days)</h2>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="spam" fill="#ef4444" name="Spam" />
                      <Bar dataKey="ham" fill="#10b981" name="Safe" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
          </>
        )}

        {history.length === 0 && (
          <div className="no-data">
            <p>Start detecting spam messages to see your statistics here!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsPage;

