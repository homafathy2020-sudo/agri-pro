@echo off
git add .
git commit -m "update %date% %time%"
git push
echo Done!
pause
