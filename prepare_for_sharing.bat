@echo off
title Prepare App for Sharing
color 0E

echo ========================================================
echo       PREPARING BANK SHEET APP FOR SHARING
echo ========================================================
echo.
echo This script will reduce the file size by deleting the 
echo 'node_modules' folder (which is very large).
echo.
echo The 'node_modules' folder will be automatically re-created
echo when the next person runs 'run_app.bat'.
echo.
echo Use this BEFORE zipping or sending the folder to someone specific.
echo.
echo ========================================================
echo.
set /p choice="Are you sure you want to proceed? (Y/N): "
if /i "%choice%" neq "Y" goto :eof

echo.
echo Deleting node_modules... (This might take a moment)
if exist "node_modules" (
    rmdir /s /q "node_modules"
    echo node_modules deleted successfully.
) else (
    echo node_modules folder not found (already clean).
)

echo.
echo ========================================================
echo                  READY TO SHARE
echo ========================================================
echo 1. Right-click the 'bank sheet' folder.
echo 2. Choose 'Send to' -> 'Compressed (zipped) folder'.
echo 3. Send the ZIP file to your colleague.
echo.
echo REMINDER: Tell them to install Node.js first!
echo ========================================================
pause
