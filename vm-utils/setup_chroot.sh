#!/bin/bash -e

[ -z "$1" ] && echo "Usage: $0 output_folder"
[ -z "$1" ] && exit 1

OUTDIR=$1

mkdir -p ${OUTDIR}/proc
mount -t proc none ${OUTDIR}/proc

mkdir -p ${OUTDIR}/sys
mount -t sysfs none ${OUTDIR}/sys

mkdir -p ${OUTDIR}/tmp
mount -t tmpfs none ${OUTDIR}/tmp

mkdir -p ${OUTDIR}/dev
mount -t devtmpfs none ${OUTDIR}/dev
mount -t devpts none ${OUTDIR}/dev/pts

mkdir -p ${OUTDIR}/etc
cp -L /etc/resolv.conf ${OUTDIR}/etc
