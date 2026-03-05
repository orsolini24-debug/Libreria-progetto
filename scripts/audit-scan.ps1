param(
    [Parameter(Mandatory=$true)]
    [string]$Pattern
)

# [GEMINI-ARCH] - Script di Audit Standardizzato (APEX v3.0)
# Whitelist di ricerca: core logic e schema
$IncludePaths = @("app", "prisma", "middleware.ts", "auth.ts", "scripts")
$ExcludePatterns = @("node_modules", ".next", ".claude", ".git", "package-lock.json")

Write-Host "`n--- AUDIT SCAN START ---" -ForegroundColor Cyan
Write-Host "Searching for: $Pattern"

# Recupero file filtrati
$Files = Get-ChildItem -Path $IncludePaths -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $filePath = $_.FullName
    $matchExclude = $false
    foreach ($ex in $ExcludePatterns) {
        if ($filePath -like "*\$ex\*") { $matchExclude = $true; break }
    }
    -not $matchExclude
}

# Ricerca pattern
$Findings = Select-String -Path $Files.FullName -Pattern $Pattern -ErrorAction SilentlyContinue

if ($Findings) {
    Write-Host "FINDINGS DETECTED:" -ForegroundColor Yellow
    $Findings | Select-Object -Property @{Name="File"; Expression={$_.Path.Replace($PSScriptRoot + "", "")}}, LineNumber, Line | Format-Table -AutoSize
} else {
    Write-Host "CLEAN: No findings detected for '$Pattern'." -ForegroundColor Green
}

Write-Host "--- AUDIT SCAN END ---`n" -ForegroundColor Cyan
