@echo off
title Logbook Aktivitas Penelitian Lapangan
echo =======================================================
echo Menjalankan Web Logbook Penelitian Lapangan...
echo =======================================================
cd /d "%~dp0"
node local_server.js
pause
