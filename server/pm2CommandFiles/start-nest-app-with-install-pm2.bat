@echo off
setlocal
pushd "%~dp0"

echo === Setting PM2_HOME so service finds saved processes ===
setx PM2_HOME "E:\ITSWeekly\pm2_home" /M
set PM2_HOME=E:\ITSWeekly\pm2_home

echo === Installing PM2 (if missing) ===
where pm2 >nul 2>nul || npm install -g pm2

echo === Installing pm2-windows-service (if missing) ===
where pm2-service-install >nul 2>nul || npm install -g pm2-windows-service

echo === Starting app with PM2 ===
pm2 start "%~dp0pm2App.config.cjs" --env production

echo === Saving PM2 process list ===
pm2 save

echo === Installing PM2 Windows Service (skip if already exists) ===
sc query "PM2-DSISite" >nul 2>nul
if %errorlevel%==0 (
  echo Service PM2-DSISite already exists, skipping install.
) else (
  pm2-service-install -n PM2-DSISite -s
)

echo.
echo === Done ===
echo Verify in services.msc that "PM2-DSISite" is:
echo  - Startup type: Automatic
echo  - Status: Running
echo After reboot, run: pm2 status

popd
endlocal