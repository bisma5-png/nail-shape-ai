@echo off
title NailSense AI - Local Studio Server
echo Starting NailSense AI on http://localhost:8080/ ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
pause
