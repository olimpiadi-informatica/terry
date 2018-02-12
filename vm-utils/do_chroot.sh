#!/bin/bash

[ -z "$1" ] && echo "Usage: $0 output_folder"
[ -z "$1" ] && exit 1

OUTDIR=$1
shift

clean_chroot() {
  $(dirname $0)/unsetup_chroot.sh ${OUTDIR}
}

trap clean_chroot EXIT
$(dirname $0)/setup_chroot.sh ${OUTDIR}

linux32 chroot ${OUTDIR} "$@"
