$files = Get-ChildItem 'F:\SelfJob\freetools\data\know\detail'
Write-Host "Total files: $($files.Count)"
Write-Host "First 3 files:"
for ($i = 0; $i -lt 3; $i++) {
    Write-Host "---"
    Write-Host $files[$i].Name
    Write-Host $files[$i].Length "bytes"
}
