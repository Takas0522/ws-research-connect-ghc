#!/usr/bin/env bash
set -e

# Global tools
npm install -g @github/copilot
dotnet tool install -g dotnet-script

# tools/m365-communication-app
cd tools/m365-communication-app && dotnet restore && cd ../..

# src/frontend
cd src/frontend && npm install && cd ../..

# Playwright CLI (https://github.com/microsoft/playwright-cli)
npm install -g @playwright/cli@latest

# src/e2e
cd src/e2e && npm install && npx playwright install --with-deps chromium
