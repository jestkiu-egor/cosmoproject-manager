$wc = New-Object System.Net.WebClient
$wc.Proxy = New-Object System.Net.WebProxy("http://161.115.231.113:9149")
$wc.Proxy.Credentials = New-Object System.Net.NetworkCredential("UZtsd1", "h4fWKh")
try {
    $result = $wc.DownloadString("https://api.groq.com")
    Write-Host "SUCCESS - Response:" $result.Substring(0, [Math]::Min(200, $result.Length))
} catch {
    Write-Host "ERROR:" $_.Exception.Message
}
