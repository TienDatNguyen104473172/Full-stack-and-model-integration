import joblib
import json
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# --- MỚI: Import thư viện Rate Limiting ---
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

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

# --- LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
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