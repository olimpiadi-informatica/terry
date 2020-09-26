#!/bin/sh -ex

# Temporary dependencies
DEPS="git libffi-dev nodejs"
apt-get install -y $DEPS

git clone --recursive https://github.com/algorithm-ninja/terry /terry

# Build the backend
cd /terry/backend
pip3 install -I -r requirements.txt
./setup.py install

# Build the frontend
cd /terry/frontend
npm install
npm run build

# Keep only the built files
cp -r build /app

# Cleanup
cd /
rm -rf /terry
apt-get purge -y $DEPS
