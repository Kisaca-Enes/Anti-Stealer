@echo off
setlocal enabledelayedexpansion

set /p NEW_WEBHOOK="Enter New Discord Webhook URL: "

if "!NEW_WEBHOOK!"=="" (
    echo [ERROR] Webhook URL cannot be empty.
    pause
    exit /b
)

echo [INFO] Updating webhook in payload.js...
powershell -Command "(Get-Content payload.js) -replace 'WEBHOOK:\s*\".*?\"', 'WEBHOOK: \"!NEW_WEBHOOK!\"' | Set-Content payload.js"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to update payload.js.
    pause
    exit /b
)

echo [SUCCESS] Webhook updated.
echo [INFO] Entering builder directory and running npm run build...

cd builder
npm run build

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed.
    pause
    exit /b
)

echo [SUCCESS] Build completed successfully.
pause
