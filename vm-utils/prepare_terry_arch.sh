#!/bin/bash -ex

[ -z "$2" ] && echo "Usage: $0 output_folder version nginx.conf config.yaml httptun_password [root_authorized_keys]"
[ -z "$2" ] && exit 1

HERE="$( cd "$(dirname "$0")" ; pwd -P )"

OUTDIR=$1
VERSION=$2
NGINX_PATH=$3
CONFIG_PATH=$4
HTTPTUN_PASSWORD=$5
ROOT_AUTHORIZED_KEYS=$6

HTTPTUN_SERVER="http://cms.di.unipi.it/vpn"

[ -f "$NGINX_PATH" ] || echo "No nginx.conf file. Please \
  create one from nginx-example.conf."
[ -f "$NGINX_PATH" ] || exit 2

[ -f "$CONFIG_PATH" ] || echo "No config.yaml file. Please \
  create one from ../territoriali-backend/config/example.config.yaml."
[ -f "$CONFIG_PATH" ] || exit 2

clean_chroot() {
  ${HERE}/unsetup_chroot.sh ${OUTDIR}
}

trap clean_chroot EXIT
${HERE}/setup_chroot.sh ${OUTDIR}

# Install deps
linux32 chroot ${OUTDIR} pacman --noconfirm -S nginx cronie pypy{,3} python{,2}-pip \
  python{,2}-sortedcontainers python-colorama python-gevent python-pyjwt \
  python-yaml python-werkzeug python-requests python-pynacl python-cffi \
  python{,2}-numpy zip htop vim gcc

linux32 chroot ${OUTDIR} pip install python-pytun

linux32 chroot ${OUTDIR} pacman -R --noconfirm gcc

# Cleanup pacman
linux32 chroot ${OUTDIR} pacman -Scc --noconfirm

# Copy data
mkdir -p ${OUTDIR}/app/territoriali-frontend
cp -r ${HERE}/../territoriali-frontend/build/* ${OUTDIR}/app/territoriali-frontend/
cp -r ${HERE}/../territoriali-backend ${OUTDIR}/app/

cp "$CONFIG_PATH" ${OUTDIR}/app/config.yaml
cp "$NGINX_PATH" ${OUTDIR}/etc/nginx/nginx.conf
cp ${HERE}/territoriali-backend.service ${OUTDIR}/etc/systemd/system
cp ${HERE}/watchdog.py ${OUTDIR}/root
mkdir -p ${OUTDIR}/etc/systemd/system/getty@tty1.service.d
cp ${HERE}/override.conf ${OUTDIR}/etc/systemd/system/getty@tty1.service.d
echo ioi > ${OUTDIR}/etc/hostname
mkdir ${OUTDIR}/root/.ssh
ssh-keygen -f ${OUTDIR}/root/.ssh/id_rsa -P "" -C "root@ioi"
echo "PermitRootLogin yes" >> ${OUTDIR}/etc/ssh/sshd_config
[ ! -z "$ROOT_AUTHORIZED_KEYS" ] && cp $ROOT_AUTHORIZED_KEYS ${OUTDIR}/root/.ssh/authorized_keys
echo tun > ${OUTDIR}/etc/modules-load.d/tun.conf

cp ${HERE}/httptun/client.py ${HERE}/httptun/common.py ${OUTDIR}/usr/local/bin/
cat > ${OUTDIR}/etc/systemd/system/httptun-client.service <<EOF
[Unit]
Description=httptun client
After=network.target

[Service]
ExecStart=/usr/local/bin/client.py "${HTTPTUN_SERVER}" "${HTTPTUN_PASSWORD}"
Restart=always
RestartSec=90
StartLimitIntervalSec=0
StartLimitBurst=3

[Install]
WantedBy=multi-user.target
EOF

echo $VERSION > ${OUTDIR}/version

# Install territoriali-backend
sudo linux32 chroot ${OUTDIR} bash -c "cd /app/territoriali-backend && \
  python setup.py install"

# Enable services
linux32 chroot ${OUTDIR} systemctl enable nginx.service
linux32 chroot ${OUTDIR} systemctl enable httptun-client.service
linux32 chroot ${OUTDIR} systemctl enable territoriali-backend.service
linux32 chroot ${OUTDIR} systemctl enable cronie.service
