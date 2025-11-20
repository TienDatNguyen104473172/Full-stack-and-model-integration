import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { spamApi } from '../services/api';
import './MonitoringPage.css';

function MonitoringPage() {
  const [metrics, setMetrics] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [driftInfo, setDriftInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  const fetchMonitoringData = useCallback(async () => {
    try {
      setError(null);
      const [metricsData, statsData, predictionsData, driftData] = await Promise.all([
        spamApi.getMonitoringMetrics(),
        spamApi.getMonitoringStats(7, 24),
        spamApi.getRecentPredictions(50),
        spamApi.getDriftDetection(7)
      ]);

      setMetrics(metricsData);
      setStats(statsData);
      setRecentPredictions(predictionsData.predictions || []);
      setDriftInfo(driftData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      setError('Không thể kết nối đến server. Vui lòng kiểm tra backend.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitoringData();

    let intervalId = null;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchMonitoringData();
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval, fetchMonitoringData]);

  if (loading) {
    return (
      <div className="monitoring-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu monitoring...</p>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="monitoring-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Lỗi kết nối</h2>
          <p>{error}</p>
          <button onClick={fetchMonitoringData} className="retry-button">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const overall = metrics?.overall || {};
  const dailyStats = stats?.daily_stats || [];
  const hourlyStats = stats?.hourly_stats || [];

  // Format data for charts
  const dailyChartData = dailyStats.map(day => ({
    date: new Date(day.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
    spam: day.spam_count,
    ham: day.ham_count,
    total: day.total_predictions,
    avgConfidence: (day.avg_confidence * 100).toFixed(1)
  }));

  const hourlyChartData = hourlyStats.map(hour => ({
    hour: new Date(hour.hour).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    spam: hour.spam_count,
    ham: hour.ham_count,
    total: hour.total_predictions,
    avgConfidence: (hour.avg_confidence * 100).toFixed(1)
  }));

  const distributionData = [
    { name: 'SPAM', value: overall.spam_count || 0, color: '#ef4444' },
    { name: 'HAM', value: overall.ham_count || 0, color: '#10b981' }
  ];

  const confidenceDistribution = recentPredictions.reduce((acc, pred) => {
    const range = Math.floor(pred.confidence * 10) / 10;
    const key = `${range.toFixed(1)}`;
    if (!acc[key]) acc[key] = 0;
    acc[key]++;
    return acc;
  }, {});

  const confidenceChartData = Object.entries(confidenceDistribution)
    .map(([range, count]) => ({ range: parseFloat(range), count }))
    .sort((a, b) => a.range - b.range);

  return (
    <div className="monitoring-page">
      <div className="monitoring-container">
        {/* Header */}
        <div className="monitoring-header">
          <div className="header-content">
            <h1 className="monitoring-title">
              <span className="title-icon">📈</span> Model Monitoring Dashboard
            </h1>
            <p className="monitoring-subtitle">Theo dõi hiệu suất model và phát hiện drift</p>
          </div>
          <div className="header-controls">
            <label className="refresh-toggle">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span>Auto Refresh</span>
            </label>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="refresh-interval"
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
            )}
            <button onClick={fetchMonitoringData} className="refresh-button">
              🔄 Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="warning-banner">
            ⚠️ {error}
          </div>
        )}

        {/* Overall Metrics */}
        <section className="monitoring-section">
          <h2 className="section-title">Tổng quan</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Tổng Predictions</div>
              <div className="metric-value">{overall.total_predictions || 0}</div>
              <div className="metric-description">Tổng số lần dự đoán</div>
            </div>
            <div className="metric-card spam-card">
              <div className="metric-label">SPAM Detected</div>
              <div className="metric-value">{overall.spam_count || 0}</div>
              <div className="metric-description">
                {overall.total_predictions > 0 
                  ? `${((overall.spam_count / overall.total_predictions) * 100).toFixed(1)}% tổng số`
                  : '0%'}
              </div>
            </div>
            <div className="metric-card ham-card">
              <div className="metric-label">HAM Detected</div>
              <div className="metric-value">{overall.ham_count || 0}</div>
              <div className="metric-description">
                {overall.total_predictions > 0 
                  ? `${((overall.ham_count / overall.total_predictions) * 100).toFixed(1)}% tổng số`
                  : '0%'}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Avg Confidence</div>
              <div className="metric-value">
                {overall.avg_confidence ? (overall.avg_confidence * 100).toFixed(1) : '0.0'}%
              </div>
              <div className="metric-description">Độ tin cậy trung bình</div>
            </div>
          </div>
        </section>

        {/* Drift Detection */}
        {driftInfo && (
          <section className="monitoring-section">
            <h2 className="section-title">Data Drift Detection</h2>
            <div className={`drift-card ${driftInfo.drift_detected ? 'drift-detected' : 'no-drift'}`}>
              <div className="drift-header">
                <span className="drift-icon">
                  {driftInfo.drift_detected ? '⚠️' : '✅'}
                </span>
                <h3>{driftInfo.message}</h3>
              </div>
              {driftInfo.current_window_avg_confidence !== null && (
                <div className="drift-details">
                  <div className="drift-metric">
                    <span className="drift-label">Current Window Avg Confidence:</span>
                    <span className="drift-value">
                      {(driftInfo.current_window_avg_confidence * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="drift-metric">
                    <span className="drift-label">Previous Window Avg Confidence:</span>
                    <span className="drift-value">
                      {(driftInfo.previous_window_avg_confidence * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="drift-metric">
                    <span className="drift-label">Difference:</span>
                    <span className="drift-value">
                      {(driftInfo.confidence_difference * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Daily Statistics */}
        {dailyChartData.length > 0 && (
          <section className="monitoring-section">
            <h2 className="section-title">Thống kê theo ngày (7 ngày gần nhất)</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#cbd5e1' }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#cbd5e1' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                  <Bar dataKey="spam" fill="#ef4444" name="SPAM" />
                  <Bar dataKey="ham" fill="#10b981" name="HAM" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Hourly Statistics */}
        {hourlyChartData.length > 0 && (
          <section className="monitoring-section">
            <h2 className="section-title">Thống kê theo giờ (24 giờ gần nhất)</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyChartData}>
                  <defs>
                    <linearGradient id="colorSpam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorHam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fill: '#cbd5e1' }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#cbd5e1' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                  <Area type="monotone" dataKey="spam" stackId="1" stroke="#ef4444" fillOpacity={1} fill="url(#colorSpam)" name="SPAM" />
                  <Area type="monotone" dataKey="ham" stackId="1" stroke="#10b981" fillOpacity={1} fill="url(#colorHam)" name="HAM" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Distribution Chart */}
        {overall.total_predictions > 0 && (
          <section className="monitoring-section">
            <h2 className="section-title">Phân bố Predictions</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    labelStyle={{ fill: '#f1f5f9', fontWeight: 600 }}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Confidence Distribution */}
        {confidenceChartData.length > 0 && (
          <section className="monitoring-section">
            <h2 className="section-title">Phân bố Confidence Score</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={confidenceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis 
                    dataKey="range" 
                    stroke="#94a3b8" 
                    tick={{ fill: '#cbd5e1' }}
                    label={{ value: 'Confidence Range', position: 'insideBottom', offset: -5, fill: '#cbd5e1' }}
                  />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#cbd5e1' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                    formatter={(value) => `${value} predictions`}
                  />
                  <Bar dataKey="count" fill="#06b6d4" name="Số lượng" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Recent Predictions Table */}
        {recentPredictions.length > 0 && (
          <section className="monitoring-section">
            <h2 className="section-title">Predictions gần nhất</h2>
            <div className="predictions-table-container">
              <table className="predictions-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Prediction</th>
                    <th>Confidence</th>
                    <th>Threshold</th>
                    <th>Client IP</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPredictions.slice(0, 20).map((pred, index) => (
                    <tr key={index}>
                      <td>
                        {new Date(pred.timestamp).toLocaleString('vi-VN')}
                      </td>
                      <td>
                        <span className={`prediction-badge ${pred.prediction === 'SPAM' ? 'spam-badge' : 'ham-badge'}`}>
                          {pred.prediction}
                        </span>
                      </td>
                      <td>
                        <span className="confidence-value">
                          {(pred.confidence * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td>{pred.threshold.toFixed(4)}</td>
                      <td className="ip-cell">{pred.client_ip || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {overall.total_predictions === 0 && (
          <div className="no-data">
            <p>Chưa có dữ liệu monitoring. Hãy thực hiện một số predictions để xem metrics!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MonitoringPage;

