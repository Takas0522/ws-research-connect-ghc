#!/usr/bin/env bash
set -e

# ── Global tools ──
npm install -g @github/copilot
dotnet tool install -g dotnet-script
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
uv python install 3.12

# ── tools/m365-communication-app (Skill依存) ──
cd tools/m365-communication-app && dotnet restore && cd ../..

# ── Backend (FastAPI) ──
cd src/backend && uv sync && cd ../..

# ── Frontend (React) ──
cd src/frontend && npm install && cd ../..

# ── Playwright CLI ──
npm install -g @playwright/cli@latest

# ── E2E tests ──
if [ -d "src/e2e" ]; then
  cd src/e2e && npm install && npx playwright install --with-deps chromium && cd ../..
fi
