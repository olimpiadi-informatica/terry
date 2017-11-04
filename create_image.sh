#!/bin/bash -e
git submodule update --init

[ -f config.yaml ] || echo "No config file"
[ -f config.yaml ] || exit
[ -f contest.zip ] || echo "No contest file"
[ -f contest.zip ] || exit

pushd territoriali-frontend
yarn build
popd

vagrant up
vagrant halt
vboxmanage export "Server gare territoriali OII" -o server_oii.ova
vboxmanage unregistervm "Server gare territoriali OII" --delete
