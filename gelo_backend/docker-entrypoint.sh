#!/bin/sh

# Đợi database sẵn sàng (tùy chọn, nhưng an toàn hơn)
echo "Waiting for database to be ready..."

# Đồng bộ schema
echo "Syncing database schema..."
npx prisma db push

# Khởi tạo dữ liệu mẫu
echo "Seeding database..."
npx prisma db seed

# Khởi động ứng dụng
echo "Starting application..."
exec npm run start:prod
