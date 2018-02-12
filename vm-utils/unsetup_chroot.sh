#!/bin/bash

[ -z "$1" ] && echo "Usage: $0 output_folder"
[ -z "$1" ] && exit 1

OUTDIR=$1

umount ${OUTDIR}/dev/pts
umount ${OUTDIR}/dev
umount ${OUTDIR}/proc
umount ${OUTDIR}/sys
umount ${OUTDIR}/tmp
