
# Open Firewall Port 3000 for RaaS Mobile Testing
# Run this script as Administrator if possible.

$port = 3000
$ruleName = "RaaS_Mobile_Access"

Write-Host "Checking for existing rule '$ruleName'..."
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

if ($existing) {
    Write-Host "Rule already exists. Removing old rule..."
    Remove-NetFirewallRule -DisplayName $ruleName
}

Write-Host "Creating Inbound TCP allow rule for Port $port..."

try {
    New-NetFirewallRule -DisplayName $ruleName `
                        -Direction Inbound `
                        -LocalPort $port `
                        -Protocol TCP `
                        -Action Allow `
                        -Profile Any `
                        -Description "Allows mobile devices to access RaaS Next.js dev server"

    Write-Host "`n[SUCCESS] Firewall rule created!" -ForegroundColor Green
    Write-Host "Your phone should now be able to connect to Port $port."
} catch {
    Write-Host "`n[ERROR] Failed to create firewall rule." -ForegroundColor Red
    Write-Host "Error Details: $_"
    Write-Host "Try running this PowerShell window as Administrator."
}
