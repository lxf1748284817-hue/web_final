@echo off
cd /d "%~dp0"
echo 启动HTTP服务器在端口8080...
echo 请在浏览器中访问: http://localhost:8080
echo 按 Ctrl+C 停止服务器
python -m http.server 8080
pause