#!/bin/bash
# Start the FastAPI server

cd "$(dirname "$0")"
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
./venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
