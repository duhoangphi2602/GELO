# Gelo AI Platform

Dự án Gelo AI là một nền tảng hỗ trợ chẩn đoán hình ảnh y tế tích hợp AI, bao gồm Backend (NestJS), AI Service (FastAPI) và Frontend (Vite/React).

## 🏗 Cấu trúc dự án
- `/gelo_backend`: API Server (NestJS + Prisma + PostgreSQL)
- `/gelo_ai`: AI Processing Service (FastAPI + PyTorch)
- `/gelo_frontend`: Giao diện người dùng (React + Vite + TailwindCSS)

---

## 🚀 Hướng dẫn cài đặt nhanh (với Docker)

### 1. Yêu cầu hệ thống
- Đã cài đặt **Docker** và **Docker Compose**.
- Đã cài đặt **Node.js** (nếu muốn chạy local).
- Đã cài đặt **Python 3.10+** (nếu muốn chạy local).

### 2. Chuẩn bị file mô hình AI (QUAN TRỌNG)
Do các file mô hình AI rất nặng nên không được lưu trên Git. Bạn cần tải các file mô hình và đặt vào đúng vị trí:
- Tải file `model.pt` (v1) và đặt vào: `gelo_ai/model_package/v1/model.pt`
- Tải file `model.pth` (v2) và đặt vào: `gelo_ai/model_package/v2/model.pth`

*(Nếu bạn không có file mô hình, AI Service sẽ báo lỗi khi khởi chạy)*

### 3. Cấu hình biến môi trường
Copy các file ví dụ và điều chỉnh thông số nếu cần:
```bash
cp gelo_backend/.env.example gelo_backend/.env
cp gelo_ai/.env.example gelo_ai/.env
cp gelo_frontend/.env.example gelo_frontend/.env
```

### 4. Khởi chạy với Docker Compose
Chạy lệnh sau tại thư mục gốc:
```bash
docker-compose up -d --build
```

Sau khi chạy xong:

### 4. Các lệnh vận hành Docker hữu ích
- **Xem log của tất cả các dịch vụ:**
  ```bash
  docker-compose logs -f
  ```
- **Xem log của một dịch vụ cụ thể (ví dụ backend):**
  ```bash
  docker-compose logs -f backend
  ```
- **Kiểm tra trạng thái các container:**
  ```bash
  docker ps
  ```
- **Dừng và xóa các container:**
  ```bash
  docker-compose down
  ```

### 5. Truy cập ứng dụng
- **Giao diện người dùng (Frontend):** [http://localhost:5173](http://localhost:5173)
- **Tài liệu Backend API:** [http://localhost:3000/api](http://localhost:3000/api)
- **Tài liệu AI Service (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛠 Hướng dẫn chạy thủ công (không dùng Docker)

### 1. Cài đặt Backend
```bash
cd gelo_backend
npm install
npx prisma generate
npm run start:dev
```

### 2. Cài đặt AI Service
```bash
cd gelo_ai
python -m venv .venv
source .venv/bin/activate  # Trên Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Cài đặt Frontend
```bash
cd gelo_frontend
npm install
npm run dev
```

---

## 📝 Lưu ý khi phát triển
- **Prisma:** Mỗi khi thay đổi database schema, hãy chạy `npx prisma migrate dev` và `npx prisma generate`.
- **CORS:** Đảm bảo `BACKEND_URL` và `FRONTEND_URL` trong các file `.env` được cấu hình chính xác.
- **AI Models:** Luôn kiểm tra cấu trúc thư mục `model_package` trước khi chạy AI service.

---

## 📞 Hỗ trợ
Nếu có bất kỳ vấn đề gì, vui lòng liên hệ với quản trị viên dự án.
