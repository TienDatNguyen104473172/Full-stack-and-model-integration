"""
Model Monitoring Module
Theo dõi hiệu suất model, predictions, và phát hiện drift
"""
import json
import os
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class ModelMonitor:
    """Class để theo dõi và giám sát model"""
    
    def __init__(self, storage_dir: str = "monitoring_data"):
        """
        Khởi tạo Model Monitor
        
        Args:
            storage_dir: Thư mục lưu trữ dữ liệu monitoring
        """
        self.storage_dir = storage_dir
        self.predictions_file = os.path.join(storage_dir, "predictions.jsonl")
        self.metrics_file = os.path.join(storage_dir, "metrics.json")
        
        # Tạo thư mục nếu chưa tồn tại
        os.makedirs(storage_dir, exist_ok=True)
        
        # Load metrics hiện tại
        self.metrics = self._load_metrics()
    
    def log_prediction(
        self,
        content: str,
        prediction: str,
        confidence: float,
        is_spam: bool,
        threshold: float,
        client_ip: Optional[str] = None
    ):
        """
        Lưu một prediction vào log
        
        Args:
            content: Nội dung tin nhắn
            prediction: Label dự đoán (SPAM/HAM)
            confidence: Confidence score
            is_spam: Boolean spam hay không
            threshold: Threshold được sử dụng
            client_ip: IP của client (optional)
        """
        prediction_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "content_length": len(content),
            "prediction": prediction,
            "confidence": float(confidence),
            "is_spam": bool(is_spam),
            "threshold": float(threshold),
            "client_ip": client_ip
        }
        
        try:
            # Append vào file JSONL (JSON Lines format)
            with open(self.predictions_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(prediction_record, ensure_ascii=False) + "\n")
            
            # Cập nhật metrics
            self._update_metrics(prediction_record)
            
        except Exception as e:
            logger.error(f"Error logging prediction: {e}")
    
    def _update_metrics(self, prediction_record: Dict):
        """Cập nhật metrics từ prediction record"""
        timestamp = datetime.fromisoformat(prediction_record["timestamp"])
        date_key = timestamp.strftime("%Y-%m-%d")
        hour_key = timestamp.strftime("%Y-%m-%d %H:00:00")
        
        # Khởi tạo metrics nếu chưa có
        if "daily_stats" not in self.metrics:
            self.metrics["daily_stats"] = {}
        if "hourly_stats" not in self.metrics:
            self.metrics["hourly_stats"] = {}
        
        # Cập nhật daily stats
        if date_key not in self.metrics["daily_stats"]:
            self.metrics["daily_stats"][date_key] = {
                "total_predictions": 0,
                "spam_count": 0,
                "ham_count": 0,
                "avg_confidence": 0.0,
                "confidence_sum": 0.0,
                "high_confidence_count": 0,  # confidence > 0.8
                "low_confidence_count": 0    # confidence < 0.3
            }
        
        daily = self.metrics["daily_stats"][date_key]
        daily["total_predictions"] += 1
        if prediction_record["is_spam"]:
            daily["spam_count"] += 1
        else:
            daily["ham_count"] += 1
        
        daily["confidence_sum"] += prediction_record["confidence"]
        daily["avg_confidence"] = daily["confidence_sum"] / daily["total_predictions"]
        
        if prediction_record["confidence"] > 0.8:
            daily["high_confidence_count"] += 1
        elif prediction_record["confidence"] < 0.3:
            daily["low_confidence_count"] += 1
        
        # Cập nhật hourly stats (giữ 24 giờ gần nhất)
        if hour_key not in self.metrics["hourly_stats"]:
            self.metrics["hourly_stats"][hour_key] = {
                "total_predictions": 0,
                "spam_count": 0,
                "ham_count": 0,
                "avg_confidence": 0.0,
                "confidence_sum": 0.0
            }
        
        hourly = self.metrics["hourly_stats"][hour_key]
        hourly["total_predictions"] += 1
        if prediction_record["is_spam"]:
            hourly["spam_count"] += 1
        else:
            hourly["ham_count"] += 1
        
        hourly["confidence_sum"] += prediction_record["confidence"]
        hourly["avg_confidence"] = hourly["confidence_sum"] / hourly["total_predictions"]
        
        # Cập nhật tổng quan
        if "overall" not in self.metrics:
            self.metrics["overall"] = {
                "total_predictions": 0,
                "spam_count": 0,
                "ham_count": 0,
                "avg_confidence": 0.0,
                "confidence_sum": 0.0,
                "first_prediction": prediction_record["timestamp"],
                "last_prediction": prediction_record["timestamp"]
            }
        
        overall = self.metrics["overall"]
        overall["total_predictions"] += 1
        if prediction_record["is_spam"]:
            overall["spam_count"] += 1
        else:
            overall["ham_count"] += 1
        
        overall["confidence_sum"] += prediction_record["confidence"]
        overall["avg_confidence"] = overall["confidence_sum"] / overall["total_predictions"]
        overall["last_prediction"] = prediction_record["timestamp"]
        
        # Lưu metrics
        self._save_metrics()
        
        # Dọn dẹp hourly stats cũ (giữ 24 giờ gần nhất)
        self._cleanup_old_hourly_stats()
    
    def _load_metrics(self) -> Dict:
        """Load metrics từ file"""
        if os.path.exists(self.metrics_file):
            try:
                with open(self.metrics_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading metrics: {e}")
                return {}
        return {}
    
    def _save_metrics(self):
        """Lưu metrics vào file"""
        try:
            with open(self.metrics_file, "w", encoding="utf-8") as f:
                json.dump(self.metrics, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error saving metrics: {e}")
    
    def _cleanup_old_hourly_stats(self):
        """Xóa hourly stats cũ hơn 24 giờ"""
        if "hourly_stats" not in self.metrics:
            return
        
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        keys_to_remove = []
        
        for hour_key in self.metrics["hourly_stats"].keys():
            try:
                hour_time = datetime.fromisoformat(hour_key)
                if hour_time < cutoff_time:
                    keys_to_remove.append(hour_key)
            except:
                keys_to_remove.append(hour_key)
        
        for key in keys_to_remove:
            del self.metrics["hourly_stats"][key]
    
    def get_overall_metrics(self) -> Dict:
        """Lấy metrics tổng quan"""
        overall = self.metrics.get("overall", {})
        
        if overall.get("total_predictions", 0) == 0:
            return {
                "total_predictions": 0,
                "spam_count": 0,
                "ham_count": 0,
                "spam_rate": 0.0,
                "ham_rate": 0.0,
                "avg_confidence": 0.0,
                "first_prediction": None,
                "last_prediction": None
            }
        
        total = overall["total_predictions"]
        spam_count = overall.get("spam_count", 0)
        ham_count = overall.get("ham_count", 0)
        
        return {
            "total_predictions": total,
            "spam_count": spam_count,
            "ham_count": ham_count,
            "spam_rate": round(spam_count / total, 4) if total > 0 else 0.0,
            "ham_rate": round(ham_count / total, 4) if total > 0 else 0.0,
            "avg_confidence": round(overall.get("avg_confidence", 0.0), 4),
            "first_prediction": overall.get("first_prediction"),
            "last_prediction": overall.get("last_prediction")
        }
    
    def get_daily_stats(self, days: int = 7) -> List[Dict]:
        """Lấy thống kê theo ngày (mặc định 7 ngày gần nhất)"""
        if "daily_stats" not in self.metrics:
            return []
        
        daily_stats = self.metrics["daily_stats"]
        
        # Sắp xếp theo ngày và lấy N ngày gần nhất
        sorted_days = sorted(daily_stats.keys(), reverse=True)[:days]
        
        result = []
        for day in sorted_days:
            stats = daily_stats[day]
            total = stats.get("total_predictions", 0)
            if total == 0:
                continue
            
            result.append({
                "date": day,
                "total_predictions": total,
                "spam_count": stats.get("spam_count", 0),
                "ham_count": stats.get("ham_count", 0),
                "spam_rate": round(stats.get("spam_count", 0) / total, 4) if total > 0 else 0.0,
                "avg_confidence": round(stats.get("avg_confidence", 0.0), 4),
                "high_confidence_count": stats.get("high_confidence_count", 0),
                "low_confidence_count": stats.get("low_confidence_count", 0)
            })
        
        return result
    
    def get_hourly_stats(self, hours: int = 24) -> List[Dict]:
        """Lấy thống kê theo giờ (mặc định 24 giờ gần nhất)"""
        if "hourly_stats" not in self.metrics:
            return []
        
        hourly_stats = self.metrics["hourly_stats"]
        
        # Sắp xếp theo giờ và lấy N giờ gần nhất
        sorted_hours = sorted(hourly_stats.keys(), reverse=True)[:hours]
        
        result = []
        for hour in sorted_hours:
            stats = hourly_stats[hour]
            total = stats.get("total_predictions", 0)
            if total == 0:
                continue
            
            result.append({
                "hour": hour,
                "total_predictions": total,
                "spam_count": stats.get("spam_count", 0),
                "ham_count": stats.get("ham_count", 0),
                "spam_rate": round(stats.get("spam_count", 0) / total, 4) if total > 0 else 0.0,
                "avg_confidence": round(stats.get("avg_confidence", 0.0), 4)
            })
        
        return result
    
    def get_recent_predictions(self, limit: int = 100) -> List[Dict]:
        """Lấy các predictions gần nhất"""
        if not os.path.exists(self.predictions_file):
            return []
        
        predictions = []
        try:
            with open(self.predictions_file, "r", encoding="utf-8") as f:
                lines = f.readlines()
                # Lấy N dòng cuối cùng
                for line in lines[-limit:]:
                    try:
                        pred = json.loads(line.strip())
                        predictions.append(pred)
                    except:
                        continue
        except Exception as e:
            logger.error(f"Error reading predictions: {e}")
        
        # Sắp xếp theo timestamp (mới nhất trước)
        predictions.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return predictions[:limit]
    
    def detect_drift(self, window_days: int = 7) -> Dict:
        """
        Phát hiện data drift bằng cách so sánh distribution của confidence
        giữa window hiện tại và window trước đó
        
        Returns:
            Dict với thông tin về drift detection
        """
        if "daily_stats" not in self.metrics or len(self.metrics["daily_stats"]) < window_days * 2:
            return {
                "drift_detected": False,
                "message": "Không đủ dữ liệu để phát hiện drift",
                "current_window_avg_confidence": None,
                "previous_window_avg_confidence": None
            }
        
        daily_stats = self.metrics["daily_stats"]
        sorted_days = sorted(daily_stats.keys(), reverse=True)
        
        # Window hiện tại (N ngày gần nhất)
        current_window = sorted_days[:window_days]
        # Window trước đó
        previous_window = sorted_days[window_days:window_days*2]
        
        if len(previous_window) == 0:
            return {
                "drift_detected": False,
                "message": "Không đủ dữ liệu để so sánh",
                "current_window_avg_confidence": None,
                "previous_window_avg_confidence": None
            }
        
        # Tính average confidence cho mỗi window
        current_confidences = []
        previous_confidences = []
        
        for day in current_window:
            stats = daily_stats[day]
            if stats.get("total_predictions", 0) > 0:
                current_confidences.append(stats.get("avg_confidence", 0.0))
        
        for day in previous_window:
            stats = daily_stats[day]
            if stats.get("total_predictions", 0) > 0:
                previous_confidences.append(stats.get("avg_confidence", 0.0))
        
        if len(current_confidences) == 0 or len(previous_confidences) == 0:
            return {
                "drift_detected": False,
                "message": "Không đủ dữ liệu để tính toán",
                "current_window_avg_confidence": None,
                "previous_window_avg_confidence": None
            }
        
        current_avg = sum(current_confidences) / len(current_confidences)
        previous_avg = sum(previous_confidences) / len(previous_confidences)
        
        # Phát hiện drift nếu sự khác biệt > 0.1 (10%)
        drift_threshold = 0.1
        drift_detected = abs(current_avg - previous_avg) > drift_threshold
        
        return {
            "drift_detected": drift_detected,
            "message": "Drift được phát hiện" if drift_detected else "Không có drift",
            "current_window_avg_confidence": round(current_avg, 4),
            "previous_window_avg_confidence": round(previous_avg, 4),
            "confidence_difference": round(abs(current_avg - previous_avg), 4),
            "drift_threshold": drift_threshold,
            "current_window_days": window_days,
            "previous_window_days": window_days
        }

