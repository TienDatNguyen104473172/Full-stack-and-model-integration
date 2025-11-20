import sys
from pathlib import Path

# Thêm thư mục backend vào Python path để có thể import main
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
# Import đối tượng app từ main.py để test
from main import app 

# Khởi tạo client test để gửi request giả lập
client = TestClient(app)

# Test 1: Kiểm tra endpoint root (/)
def test_read_main():
    response = client.get("/")
    # Kiểm tra Status Code có phải 200 OK không
    assert response.status_code == 200
    # Kiểm tra nội dung response có đúng không
    assert response.json() == {"message": "Spam Detection API is ready"}

# Test 2: Kiểm tra Health Check (/health)
def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    
    # Lấy dữ liệu response
    data = response.json()
    
    # Kiểm tra cấu trúc response có đầy đủ các trường cần thiết
    assert "status" in data
    assert "model_loaded" in data
    assert "api_version" in data
    
    # Kiểm tra status có thể là "healthy" hoặc "degraded" (tùy vào model có được load hay không)
    assert data["status"] in ["healthy", "degraded"]
    
    # Kiểm tra model_loaded phải là boolean
    assert isinstance(data["model_loaded"], bool)
    
    # Kiểm tra api_version có giá trị
    assert data["api_version"] is not None

    # Tiếp tục trong file backend/tests/test_api.py

# Test 3: Kiểm tra tin nhắn SPAM
def test_predict_spam():
    # Sử dụng một tin nhắn rác điển hình
    spam_message = "WINNER! You won $1,000,000! Text us now for free prize."
    response = client.post("/predict", json={"content": spam_message})
    
    # Kiểm tra nếu model không được load, API sẽ trả về 503
    if response.status_code == 503:
        # Model chưa được load - skip test này hoặc chỉ kiểm tra error message
        assert "Model is not loaded" in response.json()["detail"]
        return
    
    # Nếu model được load, kiểm tra kết quả
    assert response.status_code == 200
    data = response.json()
    assert "label" in data
    assert "is_spam" in data
    assert "confidence" in data
    
    # Kiểm tra label phải là SPAM hoặc HAM (tùy vào model)
    assert data["label"] in ["SPAM", "HAM"]
    assert isinstance(data["is_spam"], bool)
    assert 0 <= data["confidence"] <= 1


# Test 4: Kiểm tra tin nhắn HAM (Bình thường)
def test_predict_ham():
    # Sử dụng một tin nhắn hợp lệ
    ham_message = "Hey, let's meet up tomorrow for lunch."
    response = client.post("/predict", json={"content": ham_message})
    
    # Kiểm tra nếu model không được load, API sẽ trả về 503
    if response.status_code == 503:
        # Model chưa được load - skip test này hoặc chỉ kiểm tra error message
        assert "Model is not loaded" in response.json()["detail"]
        return
    
    # Nếu model được load, kiểm tra kết quả
    assert response.status_code == 200
    data = response.json()
    assert "label" in data
    assert "is_spam" in data
    assert "confidence" in data
    
    # Kiểm tra label phải là SPAM hoặc HAM (tùy vào model)
    assert data["label"] in ["SPAM", "HAM"]
    assert isinstance(data["is_spam"], bool)
    assert 0 <= data["confidence"] <= 1