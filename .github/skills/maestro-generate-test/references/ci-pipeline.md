# CI パイプライン統合

Maestro と Testcontainers は異なるレイヤーで動作するため、**CI パイプラインレベル**で統合する。

## ライフサイクル

```
CI/CD パイプライン
├─ Step 1: Testcontainers で MongoDB 起動 (クリーン・使い捨て)
├─ Step 2: FastAPI を MONGO_URI + ENVIRONMENT=test 付きで起動
├─ Step 3: Android エミュレータ / iOS シミュレータを起動
├─ Step 4: Maestro テスト実行
│    ├─ onFlowStart: /api/test/reset → /api/test/seed (GraalJS http)
│    ├─ テストフロー実行 (POM パターン)
│    └─ onFlowComplete: /api/test/reset (GraalJS http)
└─ Step 5: Testcontainers が MongoDB を自動破棄
```

## Testcontainers Python ヘルパー

```python
# scripts/start-test-mongo.py
from testcontainers.mongodb import MongoDbContainer

mongo = MongoDbContainer("mongo:7")
mongo.start()

connection_url = mongo.get_connection_url()
container_id = mongo.get_wrapped_container().id

with open("/tmp/test-env.sh", "w") as f:
    f.write(f'export MONGO_URI="{connection_url}/saas_management_test"\n')
    f.write(f'export MONGO_CONTAINER_ID="{container_id}"\n')
    f.write(f'export ENVIRONMENT="test"\n')

print(f"MongoDB started: {connection_url}")
```

## CI 起動スクリプト

```bash
#!/bin/bash
set -euo pipefail

# 1. MongoDB (Testcontainers)
python3 scripts/start-test-mongo.py
source /tmp/test-env.sh   # MONGO_URI, MONGO_CONTAINER_ID, ENVIRONMENT=test

# 2. FastAPI Backend
cd src/backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
sleep 5

# 3. エミュレータのアニメーション無効化 (Flaky 対策)
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0

# 4. Maestro テスト実行
cd src/maestro
maestro test .

# 5. クリーンアップ
kill $BACKEND_PID
docker rm -f "$MONGO_CONTAINER_ID"
```

## GitHub Actions ワークフロー例

```yaml
# .github/workflows/maestro-e2e.yml
name: Maestro E2E Tests
on: [push, pull_request]

jobs:
  maestro-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: |
          pip install uv testcontainers[mongodb]
          cd src/backend && uv sync

      - name: Start MongoDB (Testcontainers)
        run: python3 scripts/start-test-mongo.py

      - name: Start Backend
        run: |
          source /tmp/test-env.sh
          cd src/backend
          uv run uvicorn main:app --host 0.0.0.0 --port 8000 &

      - name: Install Maestro
        run: curl -fsSL "https://get.maestro.mobile.dev" | bash

      - name: Set up Android Emulator
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 34
          script: |
            adb shell settings put global animator_duration_scale 0
            cd src/maestro && maestro test .
```
