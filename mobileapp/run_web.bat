@echo off
rem 固定端口 5175 启动 Flutter Web 开发服务器（与 web:5173 / admin:5174 对齐）
flutter run -d web-server --web-port=5175 --web-hostname=localhost
