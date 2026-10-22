# deliverables/report/export_pdf.ps1
# ----------------------------------
# Exports the built .docx to PDF through Word.
#
# Do NOT reintroduce a Word TOC field in build_report.js. With one present,
# Word hung for 10+ minutes on both Fields.Update() and ExportAsFixedFormat()
# and produced nothing; removing it dropped the export to well under a minute.
# The contents page is therefore static text, with page numbers measured by
# measure_toc.ps1. Rebuild order: build -> measure_toc -> build -> export.
$ErrorActionPreference = 'Stop'
$src = (Resolve-Path 'deliverables\BE_Project_Report_Agentic_Multi_LLM.docx').Path
$pdf = $src -replace '\.docx$', '.pdf'
$w = New-Object -ComObject Word.Application
$w.Visible = $false; $w.DisplayAlerts = 0
try {
  $d = $w.Documents.Open($src, $false, $true)
  $d.Repaginate()
  $d.ExportAsFixedFormat($pdf, 17, $false, 0, 0, 0, 0, 0, $false, $true, 0, $false, $true, $false)
  Write-Output ("exported " + $pdf + "  pages=" + $d.ComputeStatistics(2))
  $d.Close(0)
} catch { Write-Output ("ERROR: " + $_.Exception.Message) }
finally { $w.Quit(); [System.Runtime.InteropServices.Marshal]::ReleaseComObject($w) | Out-Null }
