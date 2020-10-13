#!/bin/sh -ex

TERRY_BRANCH=${TERRY_BRANCH:-master}

# Diagnostics
echo "Building terry"
echo "Branch: $TERRY_BRANCH"
echo "Communication: $REACT_APP_COMMUNICATIONS_BASE_URI"

# Temporary dependencies
MAKE_DEPS="curl git libffi-dev"

# Install all dependencies
apt-get update -y
apt-get install -y --no-install-recommends \
    $MAKE_DEPS \
    nginx procps '^python3?$' '^python3?-(wheel|pip|numpy|sortedcontainers)$'

# Add NodeJS and automatically run 'apt-get update'
curl -sL https://deb.nodesource.com/setup_14.x | bash -
apt-get install nodejs

# Fetch Terry
git clone --recursive https://github.com/algorithm-ninja/terry /terry

# Checkout the correct branch
cd /terry
git checkout $TERRY_BRANCH

# Build the backend
cd /terry/backend
pip3 install -I -r requirements.txt
./setup.py install

# Build the frontend
cd /terry/frontend
export NODE_ENV=production
npm install
SKIP_PREFLIGHT_CHECK=true npm run build

# Keep only the built files
cp -r build /app

# Cleanup
cd /
rm -rf /terry
rm -rf /root/.npm /root/.cache/pip /var/lib/apt/lists
apt-get purge -y $MAKE_DEPS nodejs
apt-get autoremove -y
