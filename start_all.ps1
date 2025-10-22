<#
start_all.ps1

Windows-friendly unified launcher for the frontend (Vite) and backend (Flask).

Usage (PowerShell):
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  .\start_all.ps1

This script will:
- Load environment variables from .env (simple KEY=VALUE parser)
- Install frontend deps (npm install) and open the frontend dev server in a new PowerShell window
- Create a Python venv in backend/.venv if missing, install requirements, and start the backend as a background job
- Attempt to free port 5000 if a process is bound to it
#>

[CmdletBinding()]
param()

function Load-DotEnv {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return }
    Get-Content $Path | ForEach-Object {
        if ($_ -match '^[\s#]*$') { continue }
        if ($_ -match '^\s*#') { continue }
        if ($_ -match '^\s*([^=]+)=(.*)$') {
            $k = $matches[1].Trim()
            $v = $matches[2].Trim(' "')
            # Use Set-Item to set an environment variable when the name is dynamic
            Set-Item -Path ("env:$k") -Value $v
        }
    }
}

function Free-Port($port) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($conns) {
            $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($pid in $pids) {
                try {
                    Write-Host "Killing PID $pid holding port $port"
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                } catch {
                    Write-Warning ("Could not kill PID {0}: {1}" -f $pid, $_)
                }
            }
            Start-Sleep -Seconds 1
        }
    } catch {
        Write-Verbose "Free-Port: Get-NetTCPConnection not available or failed: $_"
    }
}

try {
    $scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
} catch {
    $scriptRoot = Get-Location
}

Push-Location $scriptRoot

# Load .env if present
Load-DotEnv -Path (Join-Path $scriptRoot '.env')
Write-Host "Loaded environment from .env (if present)"

$frontendDir = Join-Path $scriptRoot 'frontend'
$backendDir  = Join-Path $scriptRoot 'backend'

Write-Host "Checking frontend dependencies..."
if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
    Write-Host "Installing frontend dependencies..."
    Push-Location $frontendDir; npm install; Pop-Location
} else {
    Write-Host "Updating frontend dependencies (npm install)..."
    Push-Location $frontendDir; npm install; Pop-Location
}

Write-Host "Checking backend virtualenv and dependencies..."
if (-not (Test-Path (Join-Path $backendDir '.venv'))) {
    Write-Host "Creating backend virtualenv..."
    Push-Location $backendDir; python -m venv .venv; Pop-Location
}

$venvPython = Join-Path $backendDir '.venv\Scripts\python.exe'
if (-not (Test-Path $venvPython)) {
    Write-Warning "Backend venv python not found at $venvPython. Falling back to system 'python'."
    $venvPython = 'python'
}

if (Test-Path (Join-Path $backendDir 'requirements.txt')) {
    Write-Host "Installing backend requirements..."
    & $venvPython -m pip install -r (Join-Path $backendDir 'requirements.txt')
} else {
    Write-Warning "No requirements.txt found in backend. Skipping pip install."
}

# Free port 5000 if needed
Free-Port 5000

Write-Host "Starting backend as background job..."
# Start backend as a background job (PowerShell Job)
$backendJob = Start-Job -Name 'backend' -ScriptBlock {
    param($venvPythonPath, $cwd)
    Push-Location $cwd
    & $venvPythonPath 'run_demo.py'
    Pop-Location
} -ArgumentList $venvPython, $backendDir

Write-Host "Starting frontend in a new PowerShell window..."
# Start frontend in a new window so developer can see Vite logs
Start-Process -FilePath 'powershell' -ArgumentList '-NoExit','-Command',"cd `"$frontendDir`"; npm run dev -- --host" -WorkingDirectory $frontendDir

Write-Host "Frontend should be available at http://127.0.0.1:5173 and backend at http://127.0.0.1:5000"
Write-Host "To follow backend logs: Receive-Job -Name backend -Keep -Wait" -ForegroundColor Yellow
Write-Host "To stop backend: Stop-Job -Name backend; Remove-Job -Name backend"

# Try to open the frontend URL in a browser. Some systems may have a broken/default association
# that opens an editor like Notepad for http URLs; we'll attempt common browsers first and fall
# back to the default handler.
$frontendUrl = 'http://127.0.0.1:5173'
Start-Sleep -Seconds 2
$opened = $false
$candidates = @('msedge','chrome','firefox','iexplore')
foreach ($b in $candidates) {
    try {
        Start-Process -FilePath $b -ArgumentList $frontendUrl -ErrorAction SilentlyContinue
        $opened = $true
        break
    } catch {
        # ignore and try next
    }
}

if (-not $opened) {
    try {
        # Try the system default handler
        Start-Process $frontendUrl -ErrorAction Stop
        $opened = $true
    } catch {
        # last resort: use cmd 'start' which uses shell execute semantics
        try {
            Start-Process -FilePath 'cmd' -ArgumentList '/c','start',$frontendUrl -ErrorAction SilentlyContinue
            $opened = $true
        } catch {
            Write-Warning "Could not open $frontendUrl automatically. Please open it manually in your browser."
        }
    }
}

if ($opened) {
    Write-Host "Opened $frontendUrl in your default browser (or requested browser)."
} else {
    Write-Warning "Failed to open $frontendUrl automatically. If this opens in Notepad or another editor, check your Default Apps settings for HTTP/HTML handlers in Windows Settings > Apps > Default apps."
}

Pop-Location

Exit 0
