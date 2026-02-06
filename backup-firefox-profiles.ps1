param(
    [Parameter(Mandatory=$true)]
    [string]$Argument
)

# 隐藏窗口执行Node.js脚本
Start-Process -FilePath "node.exe" `
    -ArgumentList "backup.js", $Argument `
    -WindowStyle Hidden `
    -Wait