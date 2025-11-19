# --- Giai đoạn 1: Build Code ---
    FROM node:18-alpine as build-stage

    WORKDIR /app
    
    # Copy package.json và cài đặt thư viện
    COPY package.json package-lock.json ./
    RUN npm install
    
    # Copy toàn bộ code và Build ra thư mục dist
    COPY . .
    RUN npm run build
    
    # --- Giai đoạn 2: Chạy Web bằng Nginx ---
    FROM nginx:alpine as production-stage
    
        # Copy file đã build từ giai đoạn 1 sang thư mục của Nginx
        COPY --from=build-stage /app/dist /usr/share/nginx/html

        # Copy custom nginx configuration to proxy API requests to backend
        COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    # Mở cổng 80 (Cổng web mặc định)
    EXPOSE 80
    
    # Chạy Nginx
    CMD ["nginx", "-g", "daemon off;"]