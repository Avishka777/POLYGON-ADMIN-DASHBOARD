$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$src = "D:\Polygon\Mobile\All Apps\POLYGON-ADMIN-DASHBOARD\tools\bluetooth-printer\Program.cs"
$out = "D:\Polygon\Mobile\All Apps\POLYGON-ADMIN-DASHBOARD\tools\bluetooth-printer\BluetoothPrinterBridge.exe"

$sysRuntime = (Get-ChildItem -Path "C:\Windows\Microsoft.NET\assembly\GAC_MSIL\System.Runtime" -Recurse -Filter "*.dll" | Select-Object -First 1).FullName
$winRuntime = (Get-ChildItem -Path "C:\Windows\Microsoft.NET\assembly\GAC_MSIL\System.Runtime.WindowsRuntime" -Recurse -Filter "*.dll" | Select-Object -First 1).FullName
$interopRuntime = (Get-ChildItem -Path "C:\Windows\Microsoft.NET\assembly\GAC_MSIL\System.Runtime.InteropServices.WindowsRuntime" -Recurse -Filter "*.dll" | Select-Object -First 1).FullName

$refs = @(
    "C:\Windows\System32\WinMetadata\Windows.Foundation.winmd",
    "C:\Windows\System32\WinMetadata\Windows.Devices.winmd",
    "C:\Windows\System32\WinMetadata\Windows.Storage.winmd",
    "C:\Windows\System32\WinMetadata\Windows.Security.winmd",
    $sysRuntime,
    $winRuntime,
    $interopRuntime
)

$refArgs = $refs | ForEach-Object { "/r:`"$_`"" }
$args = @("/target:exe", "/out:`"$out`"") + $refArgs + @("`"$src`"")

Write-Host "Compiling with csc.exe..."
& $csc $args
if ($LASTEXITCODE -eq 0) {
    Write-Host "Compilation successful: $out"
} else {
    Write-Host "Compilation failed with code $LASTEXITCODE"
}
