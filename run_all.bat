@echo off
echo ===================================================
echo             Starting MemoryVerse AI System
echo ===================================================
echo.

:: Set python path and workspace directories
set BASE_DIR=%~dp0
cd /d "%BASE_DIR%"

:: Step 1: Initialize Database and seed sample data
echo [1/3] Checking Database and seeding mock records...
python database/seed.py
if %ERRORLEVEL% neq 0 (
    echo.
    echo WARNING: Database seeding failed or skipped. 
    echo If using PostgreSQL, please ensure the PostgreSQL server is running
    echo and the DATABASE_URL in your .env file is correct.
    echo.
) else (
    echo [OK] Database verified and seeded.
)
echo.

:: Step 2: Start Backend Server in a new command window
echo [2/3] Starting Backend FastAPI Server...
start "MemoryVerse Backend" cmd /k "python backend/app/main.py"
echo [OK] Backend server started in a new terminal window.
echo.

:: Step 3: Start Frontend Client Server in a new command window
echo [3/3] Starting Frontend React Client...
cd frontend
start "MemoryVerse Frontend" cmd /k "npm install && npm run dev"
echo [OK] Frontend client started in a new terminal window.
echo.

echo ===================================================
echo MemoryVerse AI is booting!
echo.
echo - Backend API Docs: http://localhost:8000/docs
echo - Frontend Dashboard: http://localhost:3000
echo.
echo Seeded Account Credentials:
echo   Email: student@university.edu
echo   Password: password123
echo ===================================================
echo.
pause
