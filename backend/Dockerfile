# 1. Sử dụng Python phiên bản nhẹ (Slim)
FROM python:3.10-slim

# 2. Thiết lập thư mục làm việc trong Container
WORKDIR /app

# 3. Copy file requirements.txt trước (để tận dụng cache)
COPY requirements.txt .

# 4. Cài đặt các thư viện
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy toàn bộ code backend vào
COPY . .

# 6. Mở cổng 8000
EXPOSE 8000

# 7. Lệnh chạy Server khi Container khởi động
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]