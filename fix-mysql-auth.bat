@echo off
REM Fix MySQL Authentication for Prisma
REM This script changes MySQL root user to use mysql_native_password instead of caching_sha2_password

echo ========================================
echo MySQL Authentication Fix for Prisma
echo ========================================
echo.

echo Stopping MySQL...
C:\xampp\mysql_stop.bat
timeout /t 3 >nul

echo Starting MySQL in safe mode...
start "MySQL Safe Mode" C:\xampp\mysql\bin\mysqld.exe --skip-grant-tables --skip-networking

timeout /t 5 >nul

echo Fixing root user authentication...
C:\xampp\mysql\bin\mysql.exe -u root --skip-ssl -e "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ''; ALTER USER 'root'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY ''; FLUSH PRIVILEGES;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! Root user authentication fixed.
    echo.
) else (
    echo.
    echo ERROR: Failed to fix authentication.
    echo.
)

echo Stopping safe mode MySQL...
taskkill /F /IM mysqld.exe >nul 2>&1
timeout /t 2 >nul

echo Starting MySQL normally...
C:\xampp\mysql_start.bat

echo.
echo ========================================
echo Done! Try running your app now.
echo ========================================
echo.
pause
