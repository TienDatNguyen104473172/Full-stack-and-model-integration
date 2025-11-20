import joblib
import json
import os
import logging
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# --- MỚI: Import thư viện Rate Limiting ---
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# --- MỚI: Import Model Monitoring ---
from monitoring import ModelMonitor

# --- 1. SETUP LOGGING ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# --- 2. LOAD CONFIGURATION ---
load_dotenv()

# --- MỚI: CẤU HÌNH RATE LIMITER ---
# get_remote_address: Xác định người dùng qua địa chỉ IP
limiter = Limiter(key_func=get_remote_address)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_FILE = "sms_logreg_pipeline.joblib"
THRESHOLD_FILE = "sms_logreg_threshold.json"
METADATA_FILE = "sms_logreg_metadata.json"

MODEL_PATH = os.path.join(BASE_DIR, "models", MODEL_FILE)
CONFIG_PATH = os.path.join(BASE_DIR, "models", THRESHOLD_FILE)
META_PATH = os.path.join(BASE_DIR, "models", METADATA_FILE)

ml_models = {}
model_monitor = None

# --- LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    global model_monitor
    logger.info("Starting Spam Detection API...")
    try:
        if os.path.exists(MODEL_PATH):
            ml_models["pipeline"] = joblib.load(MODEL_PATH)
            logger.info(f"Model loaded successfully from: {MODEL_PATH}")
        else:
            logger.error(f"Model file not found: {MODEL_PATH}")
            ml_models["pipeline"] = None

        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r") as f:
                data = json.load(f)
                ml_models["threshold"] = data.get("threshold", 0.5)
            logger.info(f"Threshold loaded: {ml_models['threshold']}")
        else:
            logger.warning("Threshold file not found, using default: 0.5")
            ml_models["threshold"] = 0.5

        if os.path.exists(META_PATH):
            with open(META_PATH, "r") as f:
                ml_models["metadata"] = json.load(f)
            logger.info("Metadata loaded.")
        else:
            logger.warning("Metadata file not found.")
            ml_models["metadata"] = None

        # --- MỚI: Khởi tạo Model Monitor ---
        monitoring_dir = os.path.join(BASE_DIR, "monitoring_data")
        model_monitor = ModelMonitor(storage_dir=monitoring_dir)
        logger.info(f"Model Monitor initialized at: {monitoring_dir}")

    except Exception as e:
        logger.critical(f"Critical Error loading ML components: {e}")
        ml_models["pipeline"] = None

    yield
    logger.info("Shutting down API...")
    ml_models.clear()

# --- APP INITIALIZATION ---
app = FastAPI(lifespan=lifespan)

# --- MỚI: Gắn Limiter vào App ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS CONFIGURATION ---
allowed_origins_str = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_str:
    origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin]
else:
    logger.warning("ALLOWED_ORIGINS not set in .env. Defaulting to localhost.")
    origins = ["http://localhost:5173", "http://localhost:3000"]

logger.info(f"CORS Configured for: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS ---
class EmailInput(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, description="Noi dung tin nhan")

# --- ENDPOINTS ---

@app.post("/predict")
@limiter.limit("10/minute") # <--- LUẬT MỚI: Chỉ cho phép 10 lần/phút
def predict_spam(request: Request, email: EmailInput): # Thêm tham số 'request' bắt buộc cho limiter
    
    # Log request dau vao
    snippet = (email.content[:50] + '...') if len(email.content) > 50 else email.content
    logger.info(f"Received prediction request: '{snippet}' from {request.client.host}")

    pipeline = ml_models.get("pipeline")
    threshold = ml_models.get("threshold")

    if pipeline is None:
        logger.error("Attempted prediction but model is not loaded.")
        raise HTTPException(status_code=503, detail="Model is not loaded properly.")

    try:
        probability = pipeline.predict_proba([email.content])[0][1]
        is_spam = probability >= threshold
        
        result_label = "SPAM" if is_spam else "HAM"
        
        logger.info(f"Prediction result: {result_label} (Confidence: {probability:.4f})")

        # --- MỚI: Log prediction vào monitoring system ---
        if model_monitor:
            try:
                client_ip = request.client.host if request.client else None
                model_monitor.log_prediction(
                    content=email.content,
                    prediction=result_label,
                    confidence=probability,
                    is_spam=is_spam,
                    threshold=threshold,
                    client_ip=client_ip
                )
            except Exception as e:
                logger.warning(f"Failed to log prediction to monitor: {e}")

        return {
            "label": result_label,
            "confidence": float(probability),
            "is_spam": bool(is_spam),
            "threshold_used": float(threshold)
        }
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal prediction error: {str(e)}")

@app.get("/info")
def get_model_info():
    return {
        "status": "active" if ml_models.get("pipeline") else "inactive",
        "threshold": ml_models.get("threshold"),
        "metadata": ml_models.get("metadata")
    }

@app.get("/health")
def health_check():
    is_model_loaded = ml_models.get("pipeline") is not None
    status = "healthy" if is_model_loaded else "degraded"
    return {
        "status": status,
        "model_loaded": is_model_loaded,
        "api_version": "1.0.0"
    }

@app.get("/")
def root():
    return {"message": "Spam Detection API is ready"}

# --- MỚI: MODEL MONITORING ENDPOINTS ---

@app.get("/monitoring/metrics")
def get_monitoring_metrics():
    """Lấy metrics tổng quan của model"""
    if model_monitor is None:
        raise HTTPException(status_code=503, detail="Model Monitor is not initialized")
    
    try:
        overall_metrics = model_monitor.get_overall_metrics()
        daily_stats = model_monitor.get_daily_stats(days=7)
        hourly_stats = model_monitor.get_hourly_stats(hours=24)
        drift_info = model_monitor.detect_drift(window_days=7)
        
        return {
            "overall": overall_metrics,
            "daily_stats": daily_stats,
            "hourly_stats": hourly_stats,
            "drift_detection": drift_info,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting monitoring metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving metrics: {str(e)}")

@app.get("/monitoring/stats")
def get_monitoring_stats(days: int = 7, hours: int = 24):
    """Lấy thống kê chi tiết theo ngày và giờ"""
    if model_monitor is None:
        raise HTTPException(status_code=503, detail="Model Monitor is not initialized")
    
    try:
        return {
            "daily_stats": model_monitor.get_daily_stats(days=days),
            "hourly_stats": model_monitor.get_hourly_stats(hours=hours),
            "overall": model_monitor.get_overall_metrics()
        }
    except Exception as e:
        logger.error(f"Error getting monitoring stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving stats: {str(e)}")

@app.get("/monitoring/predictions")
def get_recent_predictions(limit: int = 100):
    """Lấy các predictions gần nhất"""
    if model_monitor is None:
        raise HTTPException(status_code=503, detail="Model Monitor is not initialized")
    
    try:
        predictions = model_monitor.get_recent_predictions(limit=limit)
        return {
            "count": len(predictions),
            "predictions": predictions
        }
    except Exception as e:
        logger.error(f"Error getting recent predictions: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving predictions: {str(e)}")

@app.get("/monitoring/drift")
def get_drift_detection(window_days: int = 7):
    """Kiểm tra data drift"""
    if model_monitor is None:
        raise HTTPException(status_code=503, detail="Model Monitor is not initialized")
    
    try:
        drift_info = model_monitor.detect_drift(window_days=window_days)
        return drift_info
    except Exception as e:
        logger.error(f"Error detecting drift: {e}")
        raise HTTPException(status_code=500, detail=f"Error detecting drift: {str(e)}")