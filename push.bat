@echo off
chcp 65001 >nul
title رفع التعديلات على GitHub

echo ========================================
echo   جاري رفع التعديلات على GitHub...
echo ========================================
echo.

REM لازم الملف ده يكون في نفس مجلد المشروع (جنب مجلد .git وملف package.json)
cd /d "%~dp0"

echo [1/3] بضيف كل الملفات المعدّلة...
git add .

echo.
echo [2/3] بعمل commit...
set timestamp=%date% %time%
git commit -m "تحديث تلقائي - %timestamp%"

if %errorlevel% neq 0 (
    echo.
    echo لا يوجد تعديلات جديدة يتم عمل commit لها، هنكمل نتأكد من الـ push على أي حال...
)

echo.
echo [3/3] بعمل push على GitHub...
git push

echo.
if %errorlevel% equ 0 (
    echo ========================================
    echo   تم الرفع بنجاح!
    echo ========================================
) else (
    echo ========================================
    echo   حصل خطأ أثناء الرفع - راجع الرسالة اللي فوق
    echo ========================================
)

echo.
pause
