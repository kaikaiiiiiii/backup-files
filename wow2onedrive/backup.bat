<# : chooser.bat
@ECHO OFF
chcp 65001
powershell -noprofile "iex (${%~f0} | out-string)"
goto :EOF

:: end Batch portion / begin PowerShell hybrid chimera #>

node backup.js
timeout /t 10