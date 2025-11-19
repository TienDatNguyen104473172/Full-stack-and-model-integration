# 1. Sử dụng Python phiên bản đã fix
FROM python:3.11-slim 

# 2. Thiết lập thư mục làm việc trong Container
WORKDIR /app

# 3. COPY file requirements.txt (từ thư mục backend/ vào /app)
COPY backend/requirements.txt .

# 4. Cài đặt các thư viện
RUN pip install --no-cache-dir -r requirements.txt

# 5. COPY thư mục models VÀO thư mục /models trong Container
# (backend code expects models under absolute path /models)
COPY models /models

# 6. Copy toàn bộ code backend vào thư mục gốc của /app
COPY backend /app 

# 7. Mở cổng 8000
EXPOSE 8000

# 8. Lệnh chạy server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]