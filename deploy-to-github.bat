@echo off
setlocal
set "DEFAULT_REPO_URL=https://github.com/PaRsA9000/NexusAI-VideoStudio.git"
set /p "REPO_URL=Enter your GitHub repository URL [default: %DEFAULT_REPO_URL%]: "
if "%REPO_URL%"=="" set "REPO_URL=%DEFAULT_REPO_URL%"
git init
if errorlevel 1 exit /b 1
git add .
git commit -m "Initial NexusAI Video Studio project"
if errorlevel 1 exit /b 1
git branch -M main
git remote add origin "%REPO_URL%"
git push -u origin main
if errorlevel 1 exit /b 1
echo Push completed.
