#!/bin/bash -e

[ -z "$1" ] && echo "Usage: $0 output_folder"
[ -z "$1" ] && exit 1

OUTDIR=$1

[ -f $(dirname $0)/"nginx.conf" ] || echo "No nginx.conf file. Please \
  create one from nginx-example.conf."
[ -f $(dirname $0)/"nginx.conf" ] || return 2

[ -f $(dirname $0)/"config.yaml" ] || echo "No config.yaml file. Please \
  create one from ../territoriali-backend/config/example.config.yaml."
[ -f $(dirname $0)/"config.yaml" ] || return 2

clean_chroot() {
  $(dirname $0)/unsetup_chroot.sh ${OUTDIR}
}

trap clean_chroot EXIT
$(dirname $0)/setup_chroot.sh ${OUTDIR}


linux32 chroot ${OUTDIR} pacman --noconfirm -S nginx cronie pypy{,3} python{,2}-pip \
  python{,2}-sortedcontainers 

mkdir -p ${OUTDIR}/app/territoriali-frontend
cp -r $(dirname $0)/../territoriali-frontend/build/* ${OUTDIR}/app/territoriali-frontend/
cp -r $(dirname $0)/../territoriali-backend ${OUTDIR}/app/

cp $(dirname $0)/config.yaml ${OUTDIR}/app/territoriali-backend/config/
cp $(dirname $0)/nginx.conf ${OUTDIR}/etc/nginx/
cp $(dirname $0)/territoriali-backend.service ${OUTDIR}/etc/systemd/system

# Enable services
linux32 chroot ${OUTDIR} systemctl enable nginx.service 
linux32 chroot ${OUTDIR} systemctl enable territoriali-backend.service
linux32 chroot ${OUTDIR} systemctl enable cronie.service

