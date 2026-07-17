@echo off
title Lost and Found Launcher
echo ===================================================
echo   Starting Lost ^& Found Management System
echo ===================================================

:: Start Java Spring Boot Backend in a new terminal window
echo [1/2] Starting Spring Boot Backend on Port 8000...
start "Lost^&Found - Java Backend" cmd /k ".\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run -f .\Backend\pom.xml"

:: Check path and start React Frontend in a new terminal window
echo [2/2] Starting React Frontend on Port 3000...
cd Frontend
where npm >nul 2>nul
if %ERRORLEVEL% equ 0 (
    start "Lost^&Found - React Frontend" cmd /k "npm start"
) else (
    echo [System warning] npm is not in PATH. Using absolute path fallback...
    start "Lost^&Found - React Frontend" cmd /k ""C:\Program Files\nodejs\npm.cmd" start"
)

echo ===================================================
echo Project is starting up! 
echo Check the two newly opened command prompt windows.
echo ===================================================
pause
