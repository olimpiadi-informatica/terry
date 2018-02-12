#!/bin/bash

TMP=$(mktemp -d)

cleanup() {
  rm -rf ${TMP}
}

trap cleanup EXIT
