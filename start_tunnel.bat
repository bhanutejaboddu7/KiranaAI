@echo off
echo Starting public tunnel for KiranaMobile...
echo The app will be accessible at: https://kirana-app-test.loca.lt
echo Keep this window OPEN while testing the app.
call npx localtunnel --port 8000 --subdomain kirana-app-test
pause
