@echo off
title Push to GitHub

echo ========================================
echo   Pushing changes to GitHub...
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Adding all changed files...
git add .

echo.
echo [2/3] Committing...
for /f "delims=" %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set stamp=%%i
git commit -m "Auto update - %stamp%"

echo.
echo [3/3] Pushing to GitHub...
git push

echo.
if %errorlevel% equ 0 (
    echo ========================================
    echo   Push completed successfully!
    echo ========================================
) else (
    echo ========================================
    echo   An error occurred during push - see message above
    echo ========================================
)

echo.
pause
