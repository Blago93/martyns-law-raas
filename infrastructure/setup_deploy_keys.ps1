Write-Host "🔐 AWS Admin Setup for Cloud Deployment" -ForegroundColor Cyan
Write-Host "--------------------------------------------"
Write-Host "To deploy the platform, we need the 'RaasAdmin' keys (AdministratorAccess)." -ForegroundColor Yellow
Write-Host "These are DIFFERENT from the 'raas-ai-user' keys we used for Bedrock." -ForegroundColor Yellow

# 1. Prompt for Keys
$accessKey = Read-Host "Enter RaasAdmin Access Key ID (AKIA...)"
$secretKey = Read-Host "Enter RaasAdmin Secret Access Key" -AsSecureString
$region = "eu-west-2" # London (UK Data Sovereignty)

# Convert SecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey)
$plainSecret = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# 2. Configure AWS CLI (Global Profile)
Write-Host "`nConfiguring AWS CLI..." -ForegroundColor Gray
aws configure set aws_access_key_id $accessKey
aws configure set aws_secret_access_key $plainSecret
aws configure set default.region $region
aws configure set output json

# 3. Verify
$identity = aws sts get-caller-identity
Write-Host "`n✅ Identity Configured:" -ForegroundColor Green
Write-Host $identity

Write-Host "`n--------------------------------------------"
Write-Host "Ready to deploy! Run 'cdk bootstrap' next." -ForegroundColor Green
