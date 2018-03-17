#!/bin/bash -ex

[ -z "$2" ] && echo "Usage: $0 output_folder version [root_authorized_keys]"
[ -z "$2" ] && exit 1

OUTDIR=$1
VERSION=$2
NGINX_PATH=$3
CONFIG_PATH=$4
ROOT_AUTHORIZED_KEYS=$5

[ -f "$NGINX_PATH" ] || echo "No nginx.conf file. Please \
  create one from nginx-example.conf."
[ -f "$NGINX_PATH" ] || exit 2

[ -f "$CONFIG_PATH" ] || echo "No config.yaml file. Please \
  create one from ../territoriali-backend/config/example.config.yaml."
[ -f "$CONFIG_PATH" ] || exit 2

clean_chroot() {
  $(dirname $0)/unsetup_chroot.sh ${OUTDIR}
}

trap clean_chroot EXIT
$(dirname $0)/setup_chroot.sh ${OUTDIR}

# Install deps
linux32 chroot ${OUTDIR} pacman --noconfirm -S nginx cronie pypy{,3} python{,2}-pip \
  python{,2}-sortedcontainers python-colorama python-gevent python-pyjwt \
  python-yaml python-werkzeug python-pynacl python-cffi python{,2}-numpy zip \
  htop vim

# Cleanup pacman
linux32 chroot ${OUTDIR} pacman -Scc --noconfirm

# Copy data
mkdir -p ${OUTDIR}/app/territoriali-frontend
cp -r $(dirname $0)/../territoriali-frontend/build/* ${OUTDIR}/app/territoriali-frontend/
cp -r $(dirname $0)/../territoriali-backend ${OUTDIR}/app/

cp $(dirname $0)/config.yaml ${OUTDIR}/app/
cp $(dirname $0)/nginx.conf ${OUTDIR}/etc/nginx/
cp $(dirname $0)/territoriali-backend.service ${OUTDIR}/etc/systemd/system
cp $(dirname $0)/watchdog.py ${OUTDIR}/root
mkdir -p ${OUTDIR}/etc/systemd/system/getty@tty1.service.d
cp $(dirname $0)/override.conf ${OUTDIR}/etc/systemd/system/getty@tty1.service.d
echo ioi > ${OUTDIR}/etc/hostname
mkdir ${OUTDIR}/root/.ssh
ssh-keygen -f ${OUTDIR}/root/.ssh/id_rsa -P "" -C "root@ioi"
echo "PermitRootLogin yes" >> ${OUTDIR}/etc/ssh/sshd_config
[ ! -z "$ROOT_AUTHORIZED_KEYS" ] && cp $ROOT_AUTHORIZED_KEYS ${OUTDIR}/root/.ssh/authorized_keys

echo $VERSION > ${OUTDIR}/version

# Install territoriali-backend
sudo linux32 chroot ${OUTDIR} bash -c "cd /app/territoriali-backend && \
  python setup.py install"

# Enable services
linux32 chroot ${OUTDIR} systemctl enable nginx.service
linux32 chroot ${OUTDIR} systemctl enable territoriali-backend.service
linux32 chroot ${OUTDIR} systemctl enable cronie.service
