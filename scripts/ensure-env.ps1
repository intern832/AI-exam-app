$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env.local"

if (!(Test-Path $envFile)) {
  $secretBytes = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($secretBytes)
  $rng.Dispose()
  $secret = [Convert]::ToBase64String($secretBytes)
  @"
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
AI_PROVIDER=vertex
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_LOCATION=us-central1
VERTEX_AI_MODEL=gemini-2.5-flash
GOOGLE_SERVICE_ACCOUNT_JSON64=
SESSION_SECRET=$secret
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
"@ | Set-Content -Path $envFile -Encoding UTF8
  Write-Host "Created .env.local. Please fill OPENAI_API_KEY before generating exams."
} else {
  Write-Host ".env.local already exists."
}
