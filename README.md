Run backend:
cd backend && source venv/bin/activate && python main.py

Run frontend:
cd frontend

# UTD Career Spark — Fullstack Application

Table of contents

- Project overview
- Repository layout
- Quick start (pick your platform)
  - Windows (PowerShell)
  - macOS / Linux (bash / WSL)
  - Cross-platform Node launcher
  - Docker (containerized)
- Manual start (frontend & backend)
- Environment variables (.env) and secrets
- Backend: packaging & Lambda deployment
- Running tests and linting
- Troubleshooting (common issues)
- Contribution & development workflow
- Security and operational notes
- License

---

## Repository layout (top-level)

```
.
├── backend/                       # Python backend
│   ├── run_demo.py                # Backend entrypoint (example)
│   ├── requirements.txt
│   └── ...
├── frontend/                      # React + Vite app
│   ├── package.json
│   └── src/
├── start_all.sh                   # Unix-like unified launcher (bash)
├── start_all.ps1                  # Windows unified launcher (PowerShell)
├── README.md                      # <-- this file
└── ...
```

---

## Quick start (choose one)

Pick the section that matches your platform and preference. These commands assume you are in the repository root.

### Option 1 — Windows (PowerShell) — recommended for Windows devs

Use the PowerShell launcher which installs dependencies, ensures backend venv, starts backend as a job and opens the frontend in a browser.

1. Allow script execution (one-time):

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

2. Run the unified launcher:

```powershell
.\start_all.ps1
```

Notes:

- The script loads `.env` (if present), runs `npm install` in `frontend`, creates a Python venv in `backend/.venv` if missing and installs requirements, frees port 5000 if needed, then starts the backend job and opens the frontend URL in your browser.
- To see backend logs: `Receive-Job -Name backend -Keep -Wait`
- To stop backend: `Stop-Job -Name backend; Remove-Job -Name backend`

### Option 2 — macOS / Linux / WSL (Bash)

If you are on macOS or Linux, or using WSL on Windows, use the bash script.

```bash
# Ensure execute permission
chmod +x ./start_all.sh
./start_all.sh
```

This script uses POSIX tools (lsof, source, sleep) and expects a UNIX-style venv (`backend/.venv/bin/activate`). It runs frontend and backend in background and manages ports.

### Option 3 — Cross-platform Node launcher (if available)

If the repo contains a root `package.json` script `start:all` and `scripts/start-all.js`, you can run a single `npm` command that works across platforms:

```bash
npm run start:all
```

This approach spawns both frontend and backend child processes and streams logs to a single console.

### Option 4 — Docker Compose (reproducible, great for CI)

If you prefer containers, use Docker Compose (requires Docker Desktop / Engine):

```bash
docker compose up --build
```

This requires Dockerfiles for frontend and backend; if these are not present yet, ask for them to be added or follow the manual dockerfile instructions below.

---

## Manual start (what the launchers do)

To run the frontend and backend in separate terminals, do the steps below.

### Frontend (React + Vite)

```bash
# in one terminal
cd frontend
npm install          # first time only
npm run dev -- --host
```

Open http://127.0.0.1:5173 in your browser.

### Backend (Python)

```powershell
# in a second terminal (PowerShell shown, same concept for bash)
cd backend
python -m venv .venv         # first time only
# PowerShell activation (optional):
# .\.venv\Scripts\Activate.ps1
# or use the venv python directly (recommended on Windows for scripting):
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe run_demo.py
```

By default the backend listens on port 5000. The frontend launcher proxies or redirects API requests to the backend while developing.

---

## Environment variables (.env)

Place project-specific configuration in a `.env` file at the repository root (not checked into source control). Example `.env` contents:

```
# AWS
AWS_REGION=us-east-1
LAMBDA_EXECUTION_ROLE_ARN=arn:aws:iam::123456789012:role/UTD-JobMarketToolsLambdaRole

# Optional agentcore role fallback
AGENTCORE_EXECUTION_ROLE_ARN=arn:aws:iam::123456789012:role/AgentCoreRole

# Other app-specific env vars
NODE_ENV=development
```

The PowerShell and bash launchers will attempt to load `.env` into the environment for child processes.

---

## Backend: packaging & Lambda deployment

The repo contains `backend/agents-aws/deploy_lambda.py`, a convenience script that:

- installs Python dependencies to a temporary directory via `pip -t`,
- copies `lambda_job_market_tools.py` into the package,
- zips everything to `job_market_tools_lambda.zip`,
- creates or updates the Lambda function `UTD-JobMarketTools`,
- adds Bedrock invoke permission for `bedrock.amazonaws.com`.

How to use:

1. Ensure `boto3` and `python-dotenv` are installed in your dev environment:

```bash
pip install boto3 python-dotenv
```

2. Ensure AWS credentials are configured (environment variables or `~/.aws/credentials`).

3. Ensure `lambda_job_market_tools.py` and `lambda_requirements.txt` are present in `backend/agents-aws/` or the script's working dir as required.

4. Run the deploy script:

```bash
python backend/agents-aws/deploy_lambda.py
```

Notes and caveats:

- Build the Lambda package on an Amazon Linux environment (or use Docker) if you include compiled native extensions. Building on Windows/macOS can result in incompatible wheels for AWS Lambda's Linux runtime.
- The script expects an existing IAM role or environment variable `LAMBDA_EXECUTION_ROLE_ARN` or `AGENTCORE_EXECUTION_ROLE_ARN` to grant to the Lambda. If missing, it prints instructions and exits.

---

## Running tests & linting

This repository uses TypeScript/ESLint for frontend; run linting from the root or `frontend` folder depending on your project setup:

```bash
# frontend
cd frontend
npm run lint
```

For backend Python tests, use pytest if present:

```bash
pip install -r backend/requirements-dev.txt  # if present
cd backend
pytest
```

---

## Troubleshooting (common issues)

- PowerShell script blocked: if `start_all.ps1` refuses to run, update execution policy:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

- Browser opens in Notepad or wrong app: Windows Default Apps might be misconfigured. Fix via Settings → Apps → Default apps → choose your browser for `HTTP` and `HTML`.

- `npm`/`vite` not found when running from PowerShell: ensure Node is installed and available in PATH. Restart terminal after installing Node.

- Backend fails due to missing Python packages: activate the venv or call the venv python directly to install requirements.

- Lambda package incompatible: build the package on Amazon Linux or in Docker. Example Dockerfile snippet to build dependencies:

```dockerfile
FROM public.ecr.aws/lambda/python:3.11
WORKDIR /var/task
COPY lambda_requirements.txt ./
RUN pip install -r lambda_requirements.txt -t .
```

---

## Contribution & development workflow

- Fork the repo and create feature branches from `main`.
- Open PRs with a clear description, tests when applicable, and run linters.
- Keep environment secrets out of the repo. Use `.env.local` for local overrides if helpful (and add to .gitignore).

If you're adding features that require new environment variables or external services, document them in the README and provide a local dev fallback where possible.

---

## Security & operational notes

- Do not commit AWS credentials or secrets to Git. Use environment variables, AWS profiles, or a secrets manager.
- The Lambda execution role must have the least privilege necessary. The script only sets the role ARN; it does not create policies.
- Monitor Lambda size and timeouts — the script uses 60s and 512MB; increase if your workload requires it.

---

## Contact

If you hit an issue that isn't covered here paste the terminal output (or screenshot) and the steps you ran and open an issue or message a maintainer.

---

## License

This repository's license is defined in the project root (if absent, ask the authors to add a LICENSE file). Default to your institution or open-source license of choice.

---

Thank you — if you want, I can also:

- Add a cross-platform Node-based launcher (`scripts/start-all.js`) and `package.json` script,
- Add `docker-compose.yml` and Dockerfiles for both services,
- Add CI config (GitHub Actions) to run lint/tests and build Lambda packages in a reproducible environment.

Tell me which extras you'd like and I will add them.
