@echo off
title Momenti Im Admin
cd /d "%~dp0web"
echo Starting Momenti Im admin at http://localhost:3000/admin
echo.
call npm run dev
pause
