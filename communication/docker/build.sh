#!/usr/bin/env bash

cp ../target/x86_64-unknown-linux-musl/release/terry-communication-backend .
docker build -t edomora97/terry:communications-backend .
