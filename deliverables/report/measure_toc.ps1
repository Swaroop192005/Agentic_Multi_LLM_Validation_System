$ErrorActionPreference='Stop'
$src = (Resolve-Path 'deliverables\BE_Project_Report_Agentic_Multi_LLM.docx').Path
$out = 'deliverables\report\toc_pages.json'
$w = New-Object -ComObject Word.Application
$w.Visible = $false; $w.DisplayAlerts = 0
try {
  $d = $w.Documents.Open($src, $false, $true)
  $d.Repaginate()
  $map = @{}
  foreach ($p in $d.Paragraphs) {
    $st = $p.Style.NameLocal
    if ($st -eq 'Heading 1' -or $st -eq 'Heading 2') {
      $t = ($p.Range.Text -replace "[\r\a]", "").Trim()
      if ($t -and -not $map.ContainsKey($t)) {
        $map[$t] = [int]$p.Range.Information(3)   # wdActiveEndPageNumber
      }
    }
  }
  ($map | ConvertTo-Json -Depth 3) | Set-Content -Path $out -Encoding UTF8
  Write-Output ("headings mapped: " + $map.Count + "   total pages: " + $d.ComputeStatistics(2))
  $d.Close(0)
} catch { Write-Output ("ERROR: " + $_.Exception.Message) }
finally { $w.Quit(); [System.Runtime.InteropServices.Marshal]::ReleaseComObject($w) | Out-Null }
