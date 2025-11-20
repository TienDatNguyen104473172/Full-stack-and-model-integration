import axios from 'axios';

// Tạo instance axios với cấu hình chuẩn
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 giây
});

export const spamApi = {
    // 1. Gửi tin nhắn để dự đoán
    predict: async (text) => {
        try {
            const response = await apiClient.post('/predict', { content: text });
            return response.data;
        } catch (error) {
            console.error("API Predict Error:", error);
            throw error;
        }
    },

    // 2. Lấy thông tin Model (Threshold, Metadata)
    getInfo: async () => {
        try {
            const response = await apiClient.get('/info');
            return response.data;
        } catch (error) {
            console.error("API Info Error:", error);
            throw error;
        }
    },

    // 3. Kiểm tra sức khỏe Server
    checkHealth: async () => {
        try {
            const response = await apiClient.get('/health');
            return response.data;
        } catch (error) {
            return { status: 'offline' };
        }
    },

    // 4. Model Monitoring APIs
    getMonitoringMetrics: async () => {
        try {
            const response = await apiClient.get('/monitoring/metrics');
            return response.data;
        } catch (error) {
            console.error("API Monitoring Metrics Error:", error);
            throw error;
        }
    },

    getMonitoringStats: async (days = 7, hours = 24) => {
        try {
            const response = await apiClient.get('/monitoring/stats', {
                params: { days, hours }
            });
            return response.data;
        } catch (error) {
            console.error("API Monitoring Stats Error:", error);
            throw error;
        }
    },

    getRecentPredictions: async (limit = 100) => {
        try {
            const response = await apiClient.get('/monitoring/predictions', {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            console.error("API Recent Predictions Error:", error);
            throw error;
        }
    },

    getDriftDetection: async (windowDays = 7) => {
        try {
            const response = await apiClient.get('/monitoring/drift', {
                params: { window_days: windowDays }
            });
            return response.data;
        } catch (error) {
            console.error("API Drift Detection Error:", error);
            throw error;
        }
    }
};