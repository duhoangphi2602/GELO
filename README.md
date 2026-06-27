# Gelo AI Platform

Dự án Gelo AI là một nền tảng hỗ trợ chẩn đoán hình ảnh y tế tích hợp AI, bao gồm Backend (NestJS), AI Service (FastAPI) và Frontend (Vite/React).

## 🏗 Cấu trúc dự án
- `/gelo_backend`: API Server (NestJS + Prisma + PostgreSQL)
- `/gelo_ai`: AI Processing Service (FastAPI + PyTorch)
- `/gelo_frontend`: Giao diện người dùng (React + Vite + TailwindCSS)

---

## 🚀 HƯỚNG DẪN CHẠY NHANH (Dành cho Giáo viên chấm bài)

Đây là cách nhanh nhất để khởi chạy toàn bộ dự án tại môi trường local.

### 1. Yêu cầu hệ thống
- **Docker** và **Docker Compose** (Dùng để chạy Database PostgreSQL).
- **Node.js** (v18 trở lên).
- **Python** (3.10 trở lên).

### 2. Chuẩn bị file mô hình AI (BẮT BUỘC)
Do các file mô hình AI rất nặng nên không được đẩy lên Git. Bạn cần tải các file mô hình và đặt vào đúng vị trí:
- Tải file `model.pt` (v1) và đặt vào thư mục: `gelo_ai/model_package/v1/model.pt`
- Tải file `model.pth` (v2) và đặt vào thư mục: `gelo_ai/model_package/v2/model.pth`
*(Nếu không có file mô hình, AI Service sẽ báo lỗi khi khởi chạy)*

### 3. Cài đặt các thư viện (Lần chạy đầu tiên)
Trước khi chạy, hãy mở terminal ở thư mục gốc của dự án (`gelo_workspace`) và chạy lệnh cài đặt thư viện gốc:
```bash
npm install
```

### 4. Cấu hình biến môi trường (.env)
Nếu các thư mục `gelo_backend`, `gelo_frontend`, `gelo_ai` chưa có file `.env`, vui lòng copy từ file `.env.example`:
```bash
# Copy thủ công hoặc chạy lệnh:
cp gelo_backend/.env.example gelo_backend/.env
cp gelo_ai/.env.example gelo_ai/.env
cp gelo_frontend/.env.example gelo_frontend/.env
```

### 5. Khởi chạy dự án (CHỈ 1 CLICK)
Dự án đã được cấu hình script tự động chạy Database và khởi động cả 3 dịch vụ cùng lúc. Bạn chỉ cần chạy file tương ứng với Hệ điều hành của mình tại thư mục gốc:

- **Trên Windows:**
  Mở terminal và chạy lệnh:
  ```bash
  .\start.bat
  ```
  *(Hoặc click đúp vào file `start.bat` trong thư mục).*

- **Trên macOS / Linux:**
  Mở terminal và cấp quyền thực thi (nếu cần), sau đó chạy:
  ```bash
  chmod +x start.sh
  ./start.sh
  ```

---

## 🌍 Các đường dẫn truy cập (Sau khi chạy thành công)
- **Giao diện người dùng (Frontend):** [http://localhost:5173](http://localhost:5173)
- **Tài liệu Backend API:** [http://localhost:3000/api](http://localhost:3000/api)
- **Tài liệu AI Service (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

**Tài khoản đăng nhập mặc định (sau khi Seed):**
- **Admin:** `admin` / `password123`
- **Patient:** `patient` / `patient123`

---

## 🐳 Khởi chạy hoàn toàn bằng Docker (Cách thay thế)
Nếu bạn không muốn cài đặt Node.js hay Python ở máy tính, bạn có thể chạy toàn bộ dự án bằng Docker.

Chạy lệnh sau tại thư mục gốc:
```bash
docker-compose up -d --build
```
- **Xem log của tất cả các dịch vụ:** `docker-compose logs -f`
- **Dừng và xóa các container:** `docker-compose down`

---

## 📝 Lưu ý khi phát triển
- **Prisma:** Mỗi khi thay đổi database schema, hãy chạy `npx prisma migrate dev` và `npx prisma generate` trong thư mục `gelo_backend`.
- **CORS:** Đảm bảo `BACKEND_URL` và `FRONTEND_URL` trong các file `.env` được cấu hình chính xác.
- **AI Models:** Luôn kiểm tra cấu trúc thư mục `model_package` trước khi chạy AI service.

---

## 📞 Hỗ trợ
Nếu có bất kỳ vấn đề gì trong quá trình cài đặt, vui lòng liên hệ nhóm sinh viên thực hiện dự án.
