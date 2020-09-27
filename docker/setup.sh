#!/bin/sh -ex

# Temporary dependencies
MAKE_DEPS="git libffi-dev nodejs"

# Add NodeJS and automatically run 'apt-get update'
curl -sL https://deb.nodesource.com/setup_14.x | bash -

# Install all dependencies
apt-get install -y --no-install-recommends \
    $MAKE_DEPS \
    nginx '^python3?$' '^python3?-(wheel|pip|numpy|sortedcontainers)$'

# Fetch Terry
git clone --recursive https://github.com/algorithm-ninja/terry /terry

# Build the backend
cd /terry/backend
pip3 install -I -r requirements.txt
./setup.py install

# Build the frontend
cd /terry/frontend
npm install
SKIP_PREFLIGHT_CHECK=true npm run build

# Keep only the built files
cp -r build /app

# Cleanup
cd /
rm -rf /terry
rm -rf /root/.npm /root/.cache/pip /var/lib/apt/lists
apt-get purge -y $MAKE_DEPS
apt-get autoremove -y