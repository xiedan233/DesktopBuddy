@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 系统中找不到 node 命令。
  echo 请先安装 Node.js 并把它加入 PATH，或用绝对路径运行：
  echo   "C:\Users\xieda\.workbuddy\binaries\node\versions\22.22.2\node.exe" "%~dp0start-dev.js"
  echo.
  pause
  exit /b 1
)

node "%~dp0start-dev.js"

echo.
echo [已结束] 按任意键关闭此窗口。
pause >nul
