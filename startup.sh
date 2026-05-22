#!/bin/bash
# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "🚀 App Root detected at: $SCRIPT_DIR"


export PYTHONPATH=$PYTHONPATH:$SCRIPT_DIR/backend

cd "$SCRIPT_DIR/backend"

echo "🚀 Starting Gunicorn with 1 worker to save RAM..."
# --workers 1 is critical for Torch/Transformers on small servers
# --timeout 1200 gives the AI models 20 minutes to load into memory
gunicorn --bind=0.0.0.0:8000 --workers 1 --timeout 1200 --preload run:app
# Final Clean Run: 05/11/2026 03:21:01
