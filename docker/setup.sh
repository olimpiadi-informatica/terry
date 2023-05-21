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
    nginx procps zip '^python3?$' '^python3?-(wheel|pip|numpy|sortedcontainers)$'

# Install Python2 deps
curl https://bootstrap.pypa.io/pip/2.7/get-pip.py | python2
pip2 install numpy sortedcontainers

# Add NodeJS and automatically run 'apt-get update'
curl -sL https://deb.nodesource.com/setup_18.x | bash -
apt-get install nodejs

# Install yarn
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list
apt update && apt install --no-install-recommends yarn

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
yarn install --frozen-lockfile
NODE_OPTIONS=--openssl-legacy-provider SKIP_PREFLIGHT_CHECK=true DISABLE_ESLINT_PLUGIN=true yarn build

# Keep only the built files
cp -r build /app

# Save the version of terry
date +%Y%m%d > /version

# Cleanup
cd /
rm -rf /terry
rm -rf /root/.npm /root/.cache/pip /var/lib/apt/lists
apt-get purge -y $MAKE_DEPS nodejs
apt-get autoremove -y
