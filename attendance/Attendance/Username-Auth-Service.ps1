# Windows Username Authentication Service
# Runs a lightweight HTTP server on localhost:9999 that provides Windows username
# This allows the web browser to automatically detect the current user

param(
    [int]$Port = 9999
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Username Authentication Service" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting local auth service..." -ForegroundColor Yellow
Write-Host "Port: $Port" -ForegroundColor Gray
Write-Host ""
Write-Host "This service provides your Windows username" -ForegroundColor Gray
Write-Host "to the Attendance Tracker web application." -ForegroundColor Gray
Write-Host ""
Write-Host "⚠ Keep this window open while using the app" -ForegroundColor Yellow
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Create HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")

try {
    $listener.Start()
    Write-Host "✓ Service started successfully!" -ForegroundColor Green
    Write-Host "  Listening on: http://localhost:$Port/" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for requests..." -ForegroundColor Cyan
    Write-Host "(Press Ctrl+C to stop)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "----------------------------------------" -ForegroundColor DarkGray
    Write-Host ""
    
    $requestCount = 0
    
    while ($listener.IsListening) {
        # Wait for request
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $requestCount++
        $timestamp = Get-Date -Format "HH:mm:ss"
        
        # Get Windows username
        $username = $env:USERNAME.ToLower()
        
        # Log request
        Write-Host "[$timestamp] Request #$requestCount from $($request.RemoteEndPoint)" -ForegroundColor Cyan
        Write-Host "  Path: $($request.Url.LocalPath)" -ForegroundColor Gray
        Write-Host "  Username: $username" -ForegroundColor Green
        
        # Set CORS headers to allow web requests
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "*")
        $response.Headers.Add("Content-Type", "application/json; charset=utf-8")
        
        # Handle OPTIONS preflight
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            Write-Host "  → Preflight OK" -ForegroundColor DarkGray
            Write-Host ""
            continue
        }
        
        # Handle username request
        if ($request.Url.LocalPath -eq "/username" -or $request.Url.LocalPath -eq "/") {
            $jsonResponse = @{
                success = $true
                username = $username
                timestamp = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
                hostname = $env:COMPUTERNAME
                method = "local_service"
            } | ConvertTo-Json
            
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonResponse)
            $response.ContentLength64 = $buffer.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            
            Write-Host "  → Username sent: $username" -ForegroundColor Green
        }
        # Handle status/health check
        elseif ($request.Url.LocalPath -eq "/status") {
            $jsonResponse = @{
                status = "running"
                username = $username
                port = $Port
                requests = $requestCount
                uptime = ((Get-Date) - $startTime).ToString()
            } | ConvertTo-Json
            
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonResponse)
            $response.ContentLength64 = $buffer.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            
            Write-Host "  → Status check OK" -ForegroundColor DarkGray
        }
        else {
            # 404 for unknown paths
            $errorResponse = @{
                error = "Not found"
                available_endpoints = @("/username", "/status")
            } | ConvertTo-Json
            
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($errorResponse)
            $response.ContentLength64 = $buffer.Length
            $response.StatusCode = 404
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.Close()
            
            Write-Host "  → 404 Not Found" -ForegroundColor Red
        }
        
        Write-Host ""
    }
}
catch {
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
}
finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    $listener.Close()
    Write-Host ""
    Write-Host "Service stopped." -ForegroundColor Yellow
    Write-Host ""
}
