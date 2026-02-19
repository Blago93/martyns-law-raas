$envFile = ".env"

Write-Host "🔐 AWS Credential Setup for Martyn's Law RaaS" -ForegroundColor Cyan
Write-Host "--------------------------------------------"

# 1. Prompt for Keys (SecureString for Secret)
$accessKey = Read-Host "Enter your AWS Access Key ID (e.g. AKIA...)"
$secretKey = Read-Host "Enter your AWS Secret Access Key" -AsSecureString

# Convert SecureString back to plain text for file writing
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey)
$plainSecret = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# 2. Prepare Content
$content = @"
# AWS Credentials (Added via Setup Script)
AWS_ACCESS_KEY_ID=$accessKey
AWS_SECRET_ACCESS_KEY=$plainSecret
PORT=3001
"@

# 3. Write to .env
Set-Content -Path $envFile -Value $content

Write-Host "`n✅ Credentials saved to $envFile" -ForegroundColor Green
Write-Host "--------------------------------------------"
Write-Host "Next Step: Run 'node verify_hybrid_audit.js' to test connection." -ForegroundColor Yellow
