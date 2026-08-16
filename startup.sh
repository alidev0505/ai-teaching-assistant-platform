#!/bin/bash
# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "🚀 App Root detected at: $SCRIPT_DIR"

export PYTHONPATH=$PYTHONPATH:$SCRIPT_DIR/backend

cd "$SCRIPT_DIR/backend"

echo "🚀 Starting Gunicorn with 1 worker and 4 threads to save RAM while allowing concurrency..."
# Removed --preload to prevent memory crashes and DB lockups
# Added gthread to allow 1 worker to handle multiple requests safely
gunicorn --bind=0.0.0.0:8000 --workers 1 --threads 4 --worker-class gthread --timeout 600 run:app