$ErrorActionPreference = 'Stop'
$outputDir = Join-Path (Get-Location) 'test-results/diyanet'
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
$pending = @()
$completed = 0
$utf8 = New-Object System.Text.UTF8Encoding($false)
for ($pageId = 0; $pageId -lt 605 -or $pending.Count -gt 0;) {
  while ($pageId -lt 605 -and $pending.Count -lt 4) {
    $file = Join-Path $outputDir ($pageId.ToString() + '.json')
    if (Test-Path -LiteralPath $file) { $pageId++; $completed++; continue }
    $client = New-Object System.Net.WebClient
    $client.Encoding = [System.Text.Encoding]::UTF8
    $uri = 'https://kuran.diyanet.gov.tr/mushaf/qurandm/pagedata?id=' + $pageId + '&itf=false&iml=false&iqr=true&ml=5&ql=2&iar=false'
    $task = $client.DownloadStringTaskAsync([Uri]$uri)
    $pending += [PSCustomObject]@{ Page = $pageId; File = $file; Client = $client; Task = $task }
    $pageId++
  }
  $remaining = @()
  foreach ($job in $pending) {
    if ($job.Task.IsCompleted) {
      try {
        $body = $job.Task.GetAwaiter().GetResult()
        $data = $body | ConvertFrom-Json
        if (-not $data.QuranAyats) { throw 'No QuranAyats' }
        [System.IO.File]::WriteAllText($job.File, $body, $utf8)
      } catch { Write-Output ('FAILED page id ' + $job.Page + ': ' + $_.Exception.Message) }
      $job.Client.Dispose()
      $completed++
      if ($completed % 60 -eq 0) { Write-Output ('Diyanet pages: ' + $completed + '/605') }
    } else { $remaining += $job }
  }
  $pending = $remaining
  if ($pending.Count -gt 0) { Start-Sleep -Milliseconds 50 }
}
Write-Output ('Saved pages: ' + (Get-ChildItem -LiteralPath $outputDir -Filter '*.json').Count)
