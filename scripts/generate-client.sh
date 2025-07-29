#! /usr/bin/env bash

set -e
set -x

mv backend/openapi.json frontend/
cd frontend
pnpm run generate-client
npx biome format --write ./src/client
