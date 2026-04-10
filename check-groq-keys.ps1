param(
    [Parameter(Mandatory=$true)]
    [string]$KeysFile
)

$PROXY = "http://UZtsd1:h4fWKh@161.115.231.113:9149"

Write-Host "Testing Groq API Keys via Proxy" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

$keys = Get-Content $KeysFile

foreach ($line in $keys) {
    $key = $line.Trim()
    if ([string]::IsNullOrEmpty($key) -or $key.StartsWith("#")) { continue }
    
    Write-Host "Testing: $($key.Substring(0, [Math]::Min(20, $key.Length)))..." -NoNewline
    
    try {
        $headers = @{
            "Authorization" = "Bearer $key"
            "Content-Type" = "application/json"
        }
        
        $body = @{
            "model" = "llama-3.1-8b-instant"
            "messages" = @(@{ "role" = "user"; "content" = "hi" })
            "max_tokens" = 5
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "https://api.groq.com/openai/v1/chat/completions" `
            -Method POST `
            -Headers $headers `
            -Body $body
        
        if ($response.choices[0].message.content) {
            Write-Host " OK - Works!" -ForegroundColor Green
            "$key - WORKS" | Add-Content "results.txt"
        }
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -eq 403) {
            Write-Host " FORBIDDEN" -ForegroundColor Red
            "$key - FORBIDDEN" | Add-Content "results.txt"
        }
        elseif ($status -eq 401) {
            Write-Host " INVALID_KEY" -ForegroundColor Red
            "$key - INVALID" | Add-Content "results.txt"
        }
        else {
            Write-Host " ERROR ($status)" -ForegroundColor Yellow
            "$key - ERROR ($status)" | Add-Content "results.txt"
        }
    }
}

Write-Host ""
Write-Host "Done! Results saved to results.txt"
