@echo off
echo Dang su dung Node.js Portable v22 de chay du an...
echo ---------------------------------------------------

:: Trỏ đường dẫn tạm thời vào thư mục node_bin
set "PATH=%~dp0node_bin;%PATH%"

:: Kiểm tra phiên bản (để chắc chắn đang dùng bản 22)
node -v

:: Cài đặt thư viện (chỉ chạy lần đầu, các lần sau sẽ tự bỏ qua)
if not exist "node_modules" (
    echo Dang cai dat thu vien...
    call npm install
)

:: Chạy dự án
echo Dang khoi dong Server...
call npm start

pause