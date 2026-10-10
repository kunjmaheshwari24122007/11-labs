@echo off
title ElevenNarrate Audio Studio
echo ========================================================
echo   Starting ElevenNarrate Audio Studio...
echo ========================================================

REM Find Python (py launcher, installed path, or system python)
where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set "PY_CMD=py"
) else if exist "C:\Users\Admin\AppData\Local\Programs\Python\Python314\python.exe" (
    set "PY_CMD=C:\Users\Admin\AppData\Local\Programs\Python\Python314\python.exe"
) else (
    set "PY_CMD=python"
)

REM Launch local server
start http://localhost:8888
"%PY_CMD%" local_server.py
pause
