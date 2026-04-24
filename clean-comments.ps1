Get-ChildItem -Path . -Filter *.html -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $cleaned = [regex]::Replace($content, '<!--[\s\S]*?-->', '')
    $cleaned = [regex]::Replace($cleaned, '\n\n+', "`n")
    Set-Content -Path $_.FullName -Value $cleaned -NoNewline
    Write-Output ('Cleaned: ' + $_.Name)
}
