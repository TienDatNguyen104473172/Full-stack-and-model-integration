# SMS Spam Detection - Full Stack MLOps Platform

**Status:** READY FOR PRODUCTION  
**Deployment:** Render (Live)  
**Repository:** Full-stack-and-model-integration  
**Owner:** TienDatNguyen104473172

---

## Overview

SMS Spam Detection is a **production-grade full-stack machine learning application** that detects spam in SMS messages using a Logistic Regression model with TF-IDF vectorization. The platform includes a FastAPI backend, React frontend, real-time monitoring, and automated CI/CD pipeline deployed on Render.

**Key Features:**
- Spam detection with 96% accuracy using trained ML model
- Real-time API with sub-100ms inference time
- 10 requests/minute rate limiting per IP
- Complete monitoring and feedback collection system
- Production-ready with Docker containerization

---

## Demo Link

- **Live Backend API:** https://full-stack-and-model-integration.onrender.com/
- **Live Frontend UI:** https://spam-detector-web-771x.onrender.com/
- **API Documentation:** https://full-stack-and-model-integration.onrender.com/docs

---

### Please Wait for "Cold Start"
> Since this project uses the **Render Free Tier**, the servers will go to sleep after 15 minutes of inactivity.
> If you are opening the website for the first time or after a break, it may take **up to 2 minutes** for the Frontend, Backend, and ML Model to initialize and connect with each other. Thank you for your patience!

---

## Test Scenarios (Demo Scripts)

Here are some sample messages you can copy and paste to test the model's accuracy:

### Try these SPAM messages:
> **Expectation:** The model should classify these as **SPAM** with high confidence (>90%).

1.  `WINNER! You have won a <$1000> Walmart Gift Card. Call 0906638291 to claim now. Valid for 12 hours only.`
2.  `URGENT! Your mobile no was awarded a £2000 Bonus Caller Prize on 5/2025. Reply THIS MSG to get your prize.`
3.  `Free entry in 2 a wkly comp to win FA Cup final tkts 21st May 2005. Text FA to 87121 to receive entry question(std txt rate)T&C's apply 08452810075over18's`

### Try these SAFE (Ham) messages:
> **Expectation:** The model should classify these as **SAFE** (Ham).

1.  `Hey, are we still meeting for lunch tomorrow at 12?`
2.  `I'm running a bit late, please start the meeting without me. I'll be there in 15 mins.`
3.  `Mom called earlier, she wants to know when you are coming home for dinner.`

## Features

- **Real-time SMS Spam Classification:** Binary classification (spam/ham) with confidence scores
- **Tunable Decision Threshold:** Adjust spam sensitivity in `models/sms_logreg_threshold.json`
- **Prediction History:** View all past predictions with timestamps and user feedback
- **Analytics Dashboard:** Visual charts showing spam distribution, confidence trends, and performance metrics
- **Model Monitoring:** Real-time tracking of predictions, confidence scores, and data drift detection
- **User Feedback System:** Collect user corrections to improve model in future retraining
- **Health Check Endpoint:** Monitor API and model status
- **Rate Limiting:** 10 requests per minute per IP address
- **Input Validation:** Text length max 5000 characters, comprehensive error handling
- **Error Boundary:** React error boundary prevents complete UI crash
- **Production Logging:** Structured logging with INFO/ERROR levels for debugging

---

## Tech Stack

### Backend
- **Framework:** FastAPI 0.115.0
- **Server:** Uvicorn 0.30.6
- **ML:** Scikit-learn 1.7.1, Joblib 1.5.2
- **Validation:** Pydantic 2.9.2
- **Rate Limiting:** SlowAPI 0.1.9
- **Environment:** python-dotenv 1.2.1
- **Testing:** Pytest 8.2.2

### Frontend
- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.2.2
- **HTTP Client:** Axios 1.13.2
- **Routing:** React Router DOM 7.9.6
- **Charts:** Recharts 3.4.1

### Infrastructure
- **Containerization:** Docker (multi-stage builds)
- **Web Server:** Nginx (Alpine)
- **Orchestration:** Docker Compose
- **Deployment:** Render
- **CI/CD:** GitHub Actions
- **Container Registry:** GitHub Container Registry (GHCR)

---

## Installation

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- Docker & Docker Compose
- Git

### Backend Setup

```bash
# Clone repository
git clone https://github.com/TienDatNguyen104473172/Full-stack-and-model-integration.git
cd "full stack + traning model"

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
cd backend
pip install -r requirements.txt

# Create .env file
# ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env.development file
# VITE_API_URL=http://localhost:8000

# For production builds, create .env.production
# VITE_API_URL=https://backend.onrender.com
```

---

## Usage / How to Run

### Local Development

**Terminal 1 - Backend:**
```bash
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Access:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173

### Docker Compose

```bash
docker-compose up --build
```

Access:
- Backend API: http://localhost:8000
- Frontend: http://localhost:80

### Docker Individual Builds

**Backend:**
```bash
docker build -f backend/Dockerfile -t sms-detector-backend .
docker run -p 8000:8000 --env ALLOWED_ORIGINS="http://localhost:3000" sms-detector-backend
```

**Frontend:**
```bash
docker build -f frontend/Dockerfile -t sms-detector-frontend .
docker run -p 80:80 sms-detector-frontend
```

---

## API Endpoints

### Base URLs
- **Local:** http://localhost:8000
- **Production:** https://backend.onrender.com

### Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API status |
| GET | `/health` | System & model health |
| POST | `/predict` | Classify SMS as spam/ham |
| POST | `/feedback` | Submit prediction feedback |
| GET | `/metrics` | Get monitoring metrics |

### Detailed Endpoints

#### 1. GET /
Returns API status message.

**Response (200):**
```json
{
  "message": "Spam Detection API is ready"
}
```

---

#### 2. GET /health
Returns system and model health status.

**Response (200):**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2025-11-21T10:30:45.123Z",
  "version": "1.0.0",
  "uptime_seconds": 3600
}
```

---

#### 3. POST /predict
Classifies SMS text as spam or ham.

**Request:**
```json
{
  "text": "Congratulations! You won 1 million dollars. Call now!"
}
```

**Response (200):**
```json
{
  "prediction": "SPAM",
  "confidence": 0.89,
  "probability_spam": 0.89,
  "probability_ham": 0.11,
  "threshold_used": 0.5,
  "message_length": 52,
  "processed_at": "2025-11-21T10:30:45.123Z"
}
```

**Errors:**
- 400: Empty text or text exceeds 5000 characters
- 429: Rate limit exceeded (10 requests/minute)
- 500: Model processing error

---

#### 4. POST /feedback
Logs user feedback for model monitoring.

**Request:**
```json
{
  "text": "Original message",
  "prediction": "SPAM",
  "confidence": 0.89,
  "user_feedback": "correct",
  "user_comment": "Actually this was spam"
}
```

**Response (200):**
```json
{
  "message": "Feedback recorded successfully",
  "feedback_id": "uuid-string",
  "timestamp": "2025-11-21T10:30:45.123Z"
}
```

---

#### 5. GET /metrics
Retrieves aggregated performance metrics.

**Response (200):**
```json
{
  "total_predictions": 1523,
  "spam_count": 456,
  "ham_count": 1067,
  "spam_percentage": 29.94,
  "average_confidence": 0.78,
  "feedback_received": 234,
  "feedback_accuracy": 0.91,
  "last_updated": "2025-11-21T10:30:45.123Z"
}
```

---

## Project Structure

```
full stack + training model/
├─ backend/
│  ├─ main.py                      # API entry point
│  ├─ monitoring.py                # Model monitoring
│  ├─ requirements.txt             # Dependencies
│  ├─ Dockerfile
│  └─ tests/
│     └─ test_api.py
│
├─ frontend/
│  ├─ src/
│  │  ├─ App.jsx                   # Root component
│  │  ├─ pages/
│  │  │  ├─ HomePage.jsx           # SMS prediction
│  │  │  ├─ AnalyticsPage.jsx      # Performance charts
│  │  │  ├─ HistoryPage.jsx        # Prediction history
│  │  │  └─ MonitoringPage.jsx     # System monitoring
│  │  ├─ components/
│  │  │  ├─ Navigation.jsx
│  │  │  └─ ErrorBoundary.jsx
│  │  └─ services/
│  │     └─ api.js                 # Centralized API layer
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ nginx.conf
│  └─ Dockerfile
│
├─ models/
│  ├─ sms_logreg_pipeline.joblib   # Trained model
│  ├─ sms_logreg_threshold.json    # Decision threshold
│  └─ sms_logreg_metadata.json     # Model metadata
│
├─ data_raw/                        # Raw datasets
├─ data_final/                      # Train/test splits
├─ data_work/                       # Intermediate data
├─ monitoring_data/                 # Prediction logs
├─ notebooks/                       # Jupyter notebooks
│  ├─ prep_sms.ipynb
│  └─ 01_sms_baseline.ipynb
│
├─ render.yaml                      # Render deployment config
└─ README.md
```

---

## Environment Variables

### Backend (.env or .env.production)

```bash
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://frontend.onrender.com

# Optional: Model Configuration
MODEL_THRESHOLD=0.5

# Optional: Logging Level
LOG_LEVEL=INFO
```

**Loading in Python:**
```python
from dotenv import load_dotenv
import os

load_dotenv()
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
```

### Frontend (.env.development / .env.production)

```bash
# Development
VITE_API_URL=http://localhost:8000

# Production
VITE_API_URL=https://backend.onrender.com
```

**Loading in JavaScript:**
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

---

## Docker

### Backend Dockerfile

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY models /models
COPY backend /app
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile (Multi-stage)

```dockerfile
# Stage 1: Build
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```bash
docker-compose up --build          # Build and run
docker-compose up                  # Run existing containers
docker-compose down                # Stop containers
docker-compose logs -f             # View logs
```

---

## CI/CD

### GitHub Actions Workflow

Automated on every push to main branch:

1. **Setup Environment:** Install Python 3.11 and Node.js 18
2. **Backend Tests:** Run pytest suite
3. **Frontend Lint:** Run ESLint checks
4. **Build:** Create Docker images
5. **Registry Push:** Push to GitHub Container Registry (GHCR)

### Render Deployment

**Configuration:** `render.yaml`

Services auto-deploy on code push:
- **Backend:** Automatic deployment on main branch push
- **Frontend:** Manual trigger (ensure .env.production is configured)

**Access Points:**
- API: https://backend.onrender.com
- UI: https://frontend.onrender.com

### Deployment Checklist

- [x] Environment variables configured in Render dashboard
- [x] HTTPS/SSL enabled
- [x] CORS configured for production
- [x] Health checks enabled
- [x] Rate limiting active
- [x] Input validation enforced
- [x] Logging enabled
- [x] Monitoring alerts configured

---

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run specific test
pytest tests/test_api.py::test_predict -v

# Run with coverage
pytest --cov=. --cov-report=html
```

**Test Coverage:**
- Health check endpoint
- Root endpoint
- Prediction endpoint
- Error handling (empty text, too long text)
- Rate limiting enforcement

### Frontend Linting

```bash
cd frontend

# Run ESLint
npm run lint
```

---

## Troubleshooting

### Common Issues

**CORS Error:**
- Check `ALLOWED_ORIGINS` includes your frontend URL
- Verify CORS middleware active in `backend/main.py`

**Model Load Fails:**
- Verify model files exist: `ls -la models/`
- Check Joblib and scikit-learn versions match

**Frontend Blank Page:**
- Check browser console (F12) for errors
- Verify `VITE_API_URL` correctly set
- Test API: `curl http://localhost:8000/health`

**Rate Limit Blocking:**
- Wait 60 seconds before next request batch
- Modify rate limit in `backend/main.py` for testing
- Each IP has separate 10 requests/minute quota

**Docker Build Fails:**
- Check Docker daemon: `docker ps`
- Verify Dockerfile syntax
- Check disk space: `docker system df`
- Clear cache: `docker system prune -a`

**Model Predictions Inaccurate:**
- Check threshold: `cat models/sms_logreg_threshold.json`
- Review metrics: `cat models/sms_logreg_metadata.json`
- Expected accuracy: ~96%

---

## License

MIT License

Copyright (c) 2025 TienDatNguyen104473172

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Author

**TienDatNguyen104473172**

GitHub: https://github.com/TienDatNguyen104473172  
Repository: https://github.com/TienDatNguyen104473172/Full-stack-and-model-integration

---

**Last Updated:** November 21, 2025  
**Status:** Production Ready  
**Version:** 1.0.0
