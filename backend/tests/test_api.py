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