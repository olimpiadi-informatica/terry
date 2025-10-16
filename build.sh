#!/bin/bash
# This script builds the frontend and the Rust backend for production.

set -e

echo "--- Building frontend ---"
# Navigate to the frontend directory, install dependencies, and build.
(cd frontend && yarn install && yarn compile && yarn build)

echo "--- Symlinking frontend build to backend ---"
# Create a symlink in the backend's directory to the frontend build output.
# The -f flag ensures any pre-existing symlink is replaced.
ln -sf ../frontend/build rust_backend/static

echo "--- Building Rust backend ---"
# Navigate to the backend directory and build in release mode.
(cd rust_backend && SQLX_OFFLINE=true cargo build --release)

echo "--- Build complete ---"
echo "Backend executable: rust_backend/target/release/rust_backend"
echo "Frontend build: frontend/build"
