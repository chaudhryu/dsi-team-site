@echo off
setlocal
pushd "%~dp0"

echo === Installing PM2 (if missing) ===
where pm2 >nul 2>nul || npm install -g pm2

echo === Installing pm2-windows-service (if missing) ===
where pm2-service-install >nul 2>nul || npm install -g pm2-windows-service

echo === Starting app with PM2 ===
pm2 start "%cd%\pm2App.config.cjs" --env production

echo === Saving PM2 process list ===
pm2 save

echo === Installing PM2 Windows Service (one-time) ===
REM If you need a specific service account, change this line:
REM pm2-service-install -n PM2-DSISite -u MYDOMAIN\svc-node -p SomePassword123
pm2-service-install -n PM2-DSISite -s

echo.
echo === Done ===
echo Verify in services.msc that "PM2-DSISite" is:
echo  - Startup type: Automatic
echo  - Status: Running
echo After reboot, run: pm2 status
popd
endlocal
