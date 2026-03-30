$files = Get-ChildItem 'F:\SelfJob\freetools\data\know\detail'
$content = Get-Content $files[0].FullName -Raw
Write-Host $content
